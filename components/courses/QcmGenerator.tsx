'use client'

import { useEffect, useRef, useState } from 'react'

import { QCM_DIFFICULTIES } from '@/lib/ai/prompts'

interface QcmGeneratorProps {
  courseId: string
}

type LevelState = { complete: boolean; fiches: number; fichesTotal: number }

/**
 * Nombre de passages cote navigateur. Chaque passage appelle les niveaux encore
 * incomplets ; la route est idempotente et ne regenere que ce qui manque.
 *
 * Mesure du 2026-09-26 (scripts/qcm-bench, 216 appels) : un appel Claude par
 * fiche reussit du premier coup dans ~100 % des cas et la route elle-meme
 * reessaie tant qu'il lui reste du temps. Trois passages sont donc tres
 * largement suffisants — et si ça ne suffisait pas, le reconciliateur serveur
 * (pg_cron, chaque minute) termine le travail meme onglet ferme. Cette boucle
 * n'est pas la garantie, elle est la version rapide pour l'eleve qui attend.
 */
const MAX_PASSES = 3
const PAUSE_BETWEEN_PASSES_MS = 1500

export function QcmGenerator({ courseId }: QcmGeneratorProps) {
  const [levels, setLevels] = useState<Record<string, LevelState>>({})
  const [phase, setPhase] = useState<'working' | 'complete' | 'partial'>('working')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void run()
  }, []) // eslint-disable-line

  async function callLevel(difficulty: string): Promise<LevelState> {
    const res = await fetch('/api/generate-qcm/level', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, difficulty }),
    })
    if (!res.ok) throw new Error(String(res.status))
    const d = await res.json()
    return {
      complete: Boolean(d?.complete),
      fiches: Number(d?.fiches ?? 0),
      fichesTotal: Number(d?.fichesTotal ?? 0),
    }
  }

  async function run() {
    const state: Record<string, LevelState> = {}

    for (let pass = 1; pass <= MAX_PASSES; pass++) {
      const todo = QCM_DIFFICULTIES.filter((d) => !state[d]?.complete)
      if (todo.length === 0) break
      if (pass > 1) await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_PASSES_MS))

      await Promise.allSettled(
        todo.map(async (difficulty) => {
          try {
            state[difficulty] = await callLevel(difficulty)
          } catch (err) {
            console.error('[QcmGenerator]', difficulty, err)
            state[difficulty] = state[difficulty] ?? { complete: false, fiches: 0, fichesTotal: 0 }
          }
          setLevels({ ...state })
        })
      )
    }

    const allComplete = QCM_DIFFICULTIES.every((d) => state[d]?.complete)

    if (allComplete) {
      await fetch('/api/mark-qcm-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      }).catch(() => {})
    }

    setPhase(allComplete ? 'complete' : 'partial')
    // Recharge dans les deux cas : ce qui est genere est jouable tout de suite.
    setTimeout(() => window.location.reload(), 800)
  }

  const done = QCM_DIFFICULTIES.filter((d) => levels[d]?.complete).length
  const total = QCM_DIFFICULTIES.length
  const percent = Math.round((done / total) * 100)

  if (phase === 'complete') {
    return (
      <div className="rounded-card border border-sky-border bg-sky-surface px-5 py-4 dark:border-night-border dark:bg-night-surface">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-dark" />
          <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
            QCM prêt ! Chargement...
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'partial') {
    // Pas un message d'erreur : le serveur termine tout seul, l'élève n'a rien
    // à faire et surtout rien à relancer à la main.
    return (
      <div className="rounded-card border border-sky-border bg-sky-surface px-5 py-4 dark:border-night-border dark:bg-night-surface">
        <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main mb-1">
          Tes QCM arrivent
        </p>
        <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          {done}/{total} niveaux sont prêts et jouables maintenant. Les derniers finissent de se
          préparer en arrière-plan — reviens dans une minute, tu n&apos;as rien à faire.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-sky-border bg-sky-surface px-5 py-4 dark:border-night-border dark:bg-night-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-dark" />
          <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
            Génération des QCM (3 niveaux, toutes les fiches) en cours...
          </p>
        </div>
        <span className="font-display text-[14px] font-bold text-brand dark:text-brand-dark">
          {done}/{total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
        <div
          className="h-full rounded-pill bg-brand transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-500 dark:bg-brand-dark"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
        Lis tes fiches pendant ce temps ! Les QCM sont inclus dans le coût du cours.
      </p>
    </div>
  )
}
