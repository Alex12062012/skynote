'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import Link from 'next/link'

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

    await fetch('/api/mark-qcm-ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch(() => {})

    router.refresh()
  }

  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  const isFinished = done === total && done > 0

  if (isFinished) {
    return (
      <div className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface-2 px-5 py-4 dark:border-night-border dark:bg-night-surface-2">
        <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
          {total} fiches — QCM prets
        </p>
        <Link
          href={`/courses/${courseId}/qcm`}
          className="flex items-center gap-1.5 rounded-input bg-brand px-4 py-2 font-body text-[13px] font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0 dark:bg-brand-dark"
        >
          <Zap className="h-4 w-4" />
          Faire le QCM
        </Link>
      </div>
    )
  }

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

      <div className="mt-2 flex items-center justify-between">
        <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
          Lis tes fiches pendant ce temps !
        </p>
        <Link
          href={`/courses/${courseId}/qcm`}
          className="font-body text-[12px] text-brand underline-offset-2 hover:underline dark:text-brand-dark"
        >
          Essayer quand meme
        </Link>
      </div>

      {error && (
        <p className="mt-2 font-body text-[12px] text-amber-600 dark:text-amber-400">
          Une erreur sur une fiche — la generation continue.
        </p>
      )}
    </div>
  )
}
