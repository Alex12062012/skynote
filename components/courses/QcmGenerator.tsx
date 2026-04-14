'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

interface QcmGeneratorProps {
  courseId: string
  flashcards: { id: string; title: string }[]
}

export function QcmGenerator({ courseId, flashcards }: QcmGeneratorProps) {
  const router = useRouter()
  const [done, setDone] = useState(0)
  const [total] = useState(flashcards.length)
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => { generateAll() }, []) // eslint-disable-line

  async function generateAll() {
    let completed = 0
    for (const flashcard of flashcards) {
      try {
        await fetch('/api/generate-qcm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flashcardId: flashcard.id }),
        })
        completed++
        setDone(completed)
      } catch {
        setError(true)
      }
    }

    // Marquer les QCM comme prêts dans Supabase via une route
    await fetch('/api/mark-qcm-ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch(() => {})

    setFinished(true)
    // Recharger la page pour afficher le bouton QCM
    setTimeout(() => router.refresh(), 500)
  }

  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  if (finished) {
    return (
      <div className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface-2 px-5 py-4 dark:border-night-border dark:bg-night-surface-2">
        <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
          {total} fiches — QCM prêts
        </p>
        <a href={`/courses/${courseId}/qcm`} className="flex items-center gap-1.5 rounded-input bg-brand px-4 py-2 font-body text-[13px] font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0 dark:bg-brand-dark">
          <Zap className="h-4 w-4" />
          Faire le QCM
        </a>
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
      
      {/* Barre de progression */}
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
          ⚠️ Une erreur s'est produite sur une fiche — la génération continue.
        </p>
      )}
    </div>
  )
}
