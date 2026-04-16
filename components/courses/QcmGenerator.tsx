'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const DIFFICULTIES = ['peaceful', 'easy', 'medium', 'hard']

interface QcmGeneratorProps {
  courseId: string
  flashcards: { id: string; title: string }[]
}

export function QcmGenerator({ courseId, flashcards }: QcmGeneratorProps) {
  const router = useRouter()
  const [done, setDone] = useState(0)
  const [error, setError] = useState(false)
  const total = flashcards.length

  useEffect(() => { generateAll() }, []) // eslint-disable-line

  async function generateAll() {
    let completed = 0
    for (const flashcard of flashcards) {
      try {
        // Meme chose qu'avant, mais 4 niveaux au lieu d'un seul
        await Promise.all(
          DIFFICULTIES.map((difficulty) =>
            fetch('/api/generate-qcm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flashcardId: flashcard.id, difficulty }),
            })
          )
        )
        completed++
        setDone(completed)
      } catch {
        setError(true)
      }
    }

    await fetch('/api/mark-qcm-ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch(() => {})

    setTimeout(() => router.refresh(), 500)
  }

  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="rounded-card border border-sky-border bg-sky-surface px-5 py-4 dark:border-night-border dark:bg-night-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-dark" />
          <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
            Generation des QCM (4 niveaux) en cours...
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

      {error && (
        <p className="mt-2 font-body text-[12px] text-amber-600 dark:text-amber-400">
          Une erreur s'est produite sur une fiche — la generation continue.
        </p>
      )}
    </div>
  )
}
