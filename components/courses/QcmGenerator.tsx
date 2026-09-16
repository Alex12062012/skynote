'use client'

import { useEffect, useRef, useState } from 'react'

import { QCM_DIFFICULTIES } from '@/lib/ai/prompts'

interface QcmGeneratorProps {
  courseId: string
}

export function QcmGenerator({ courseId }: QcmGeneratorProps) {
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)
  const started = useRef(false)
  const total = QCM_DIFFICULTIES.length

  useEffect(() => {
    if (started.current) return
    started.current = true
    generateAll()
  }, []) // eslint-disable-line

  // Un appel par niveau, les 3 en parallele : toutes les fiches du cours sont
  // generees dans le meme appel Claude (3 appels par cours au lieu de
  // fiches × niveaux). Un niveau qui echoue n'empeche pas les deux autres.
  async function generateAll() {
    const failures: string[] = []
    const labels: Record<string, string> = { peaceful: 'Paisible', easy: 'Normal', medium: 'Hardcore' }

    await Promise.allSettled(
      QCM_DIFFICULTIES.map(async (difficulty) => {
        try {
          const res = await fetch('/api/generate-qcm/level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, difficulty }),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error || `${res.status}`)
          }
          const data = await res.json()
          if (data?.fichesMissing > 0) {
            failures.push(`${labels[difficulty]} : ${data.fichesMissing} fiche(s) non générée(s)`)
          }
        } catch (err: any) {
          failures.push(`${labels[difficulty]} — ${err?.message || err}`)
          console.error('[QcmGenerator]', difficulty, err)
        } finally {
          setDone((d) => d + 1)
        }
      })
    )

    if (failures.length > 0) {
      setError(failures.join(' | '))
      return
    }

    await fetch('/api/mark-qcm-ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch(() => {})

    setComplete(true)
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  if (complete) {
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

  if (error) {
    return (
      <div className="rounded-card border border-red-300 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950">
        <p className="font-body text-[14px] font-semibold text-red-700 dark:text-red-300 mb-2">
          Erreur lors de la génération des QCM
        </p>
        <p className="font-body text-[12px] text-red-600 dark:text-red-400 mb-3 break-words">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="font-body text-[13px] font-semibold text-red-700 underline dark:text-red-300"
        >
          Réessayer
        </button>
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
        Lis tes fiches pendant ce temps ! Les QCM sont inclus dans le coût du cours. Une fiche qui n'a pas pu être générée reste disponible gratuitement depuis la page QCM.
      </p>

    </div>
  )
}
