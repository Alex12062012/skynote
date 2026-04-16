'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface QcmGeneratorProps {
  courseId: string
  flashcards: { id: string; title: string }[]
}

export function QcmGenerator({ courseId, flashcards }: QcmGeneratorProps) {
  const router = useRouter()
  const triggered = useRef(false)
  const [done, setDone] = useState(0)
  const [currentTitle, setCurrentTitle] = useState('')
  const [error, setError] = useState(false)
  const total = flashcards.length

  useEffect(() => {
    if (triggered.current) return
    triggered.current = true
    generateSequentially()
  }, []) // eslint-disable-line

  async function generateSequentially() {
    for (let i = 0; i < flashcards.length; i++) {
      const flashcard = flashcards[i]
      setCurrentTitle(flashcard.title)

      try {
        await fetch('/api/generate-qcm/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flashcardId: flashcard.id, courseId }),
        })
      } catch {
        setError(true)
      }

      setDone(i + 1)
    }

    // Marquer ready AVANT le refresh — toujours, meme si certaines fiches ont echoue
    await fetch('/api/mark-qcm-ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch(() => {})

    // Le refresh recharge la page : qcm_status='ready' affiche le bouton QCM directement
    router.refresh()
  }

  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="rounded-card border border-sky-border bg-sky-surface px-5 py-4 dark:border-night-border dark:bg-night-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-dark" />
          <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main truncate">
            {currentTitle ? `QCM : ${currentTitle}` : 'Preparation des QCM...'}
          </p>
        </div>
        <span className="font-display text-[14px] font-bold text-brand dark:text-brand-dark flex-shrink-0 ml-2">
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
          Une erreur sur une fiche — la generation continue.
        </p>
      )}
    </div>
  )
}
