'use client'

import { useEffect, useRef, useState } from 'react'

const DIFFICULTIES = ['peaceful', 'easy', 'medium', 'hard']

interface QcmGeneratorProps {
  courseId: string
  flashcards: { id: string; title: string }[]
}

export function QcmGenerator({ courseId, flashcards }: QcmGeneratorProps) {
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)
  const started = useRef(false)
  const total = flashcards.length

  useEffect(() => {
    if (started.current) return
    started.current = true
    generateAll()
  }, []) // eslint-disable-line

  async function generateAll() {
    let completed = 0
    const failures: string[] = []

    for (const flashcard of flashcards) {
      const results = await Promise.allSettled(
        DIFFICULTIES.map(async (difficulty) => {
          const res = await fetch('/api/generate-qcm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flashcardId: flashcard.id, difficulty }),
          })
          if (!res.ok) {
            const body = await res.text().catch(() => '')
            throw new Error(`${difficulty}: ${res.status} ${body.slice(0, 200)}`)
          }
          return res.json()
        })
      )

      const rejected = results.filter((r) => r.status === 'rejected')
      if (rejected.length > 0) {
        rejected.forEach((r: any) =>
          failures.push(`${flashcard.title} — ${r.reason?.message || r.reason}`)
        )
        console.error('[QcmGenerator] Failures', flashcard.title, rejected)
      }

      completed++
      setDone(completed)
    }

    if (failures.length > 0) {
      setError(failures.slice(0, 3).join(' | '))
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
            Génération des QCM (4 niveaux) en cours...
          </p>
        </div>
        <span className="font-display text-[14px] font-bold text-brand dark:text-brand-dark">
          {done}/{total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
        <div
          className="h-full rounded-pill bg-brand transition-all duration-500 dark:bg-brand-dark"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
        Lis tes fiches pendant ce temps !
      </p>

    </div>
  )
}
