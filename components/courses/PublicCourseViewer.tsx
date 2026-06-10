'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Flashcard } from '@/types/database'

interface PublicCourseViewerProps {
  flashcards: Flashcard[]
  courseId: string
  /** true si le cours est déjà dans le compte du visiteur connecté */
  isOwnCourse?: boolean
  qcmReady?: boolean
}

export function PublicCourseViewer({ flashcards, courseId, isOwnCourse = false, qcmReady = false }: PublicCourseViewerProps) {
  const [index, setIndex] = useState(0)
  const card = flashcards[index]
  const total = flashcards.length

  const keyPoints: string[] = Array.isArray(card.key_points)
    ? card.key_points
    : (() => { try { return JSON.parse(String(card.key_points || '[]')) } catch { return [] } })()

  // Lien du bouton QCM : si le cours est déjà dans le compte du visiteur, on
  // l'envoie directement au QCM. Sinon, créer un compte est l'étape requise.
  const qcmHref = isOwnCourse
    ? `/courses/${courseId}/qcm?fiche=${index}`
    : `/signup?shared=${courseId}`

  return (
    <div className="flex flex-col gap-6">
      {/* Miniatures */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {flashcards.map((f, i) => (
          <button key={f.id} onClick={() => setIndex(i)}
            className={cn('flex-shrink-0 rounded-input px-3 py-1.5 font-body text-[12px] font-medium transition-all',
              i === index ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                : 'bg-sky-cloud text-text-secondary dark:bg-night-border dark:text-text-dark-secondary')}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Carte principale */}
      <div key={card.id}
        className="rounded-card border border-sky-border bg-sky-surface p-6 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark animate-fade-in">
        <span className="font-body text-label-caps text-text-tertiary dark:text-text-dark-tertiary">
          Fiche {index + 1} / {total}
        </span>
        <h2 className="mt-1 font-display text-h3 text-text-main dark:text-text-dark-main">{card.title}</h2>

        <p className="mb-5 mt-4 font-body text-[15px] leading-relaxed text-text-secondary dark:text-text-dark-secondary">
          {card.summary}
        </p>

        <div className="space-y-2.5">
          <p className="font-body text-label-caps text-text-tertiary dark:text-text-dark-tertiary">Points essentiels</p>
          <ul className="space-y-2">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft font-body text-[11px] font-bold text-brand dark:bg-brand-dark-soft dark:text-brand-dark">
                  {i + 1}
                </span>
                <span className="font-body text-[14px] leading-relaxed text-text-main dark:text-text-dark-main">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation + bouton QCM */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />Précédente
        </Button>

        {qcmReady && (
          <Link href={qcmHref}>
            <Button size="sm" className="gap-1.5 animate-fade-in">
              <Zap className="h-4 w-4" />
              QCM fiche {index + 1}
            </Button>
          </Link>
        )}

        <Button variant="secondary" size="sm" onClick={() => setIndex(Math.min(total - 1, index + 1))} disabled={index === total - 1} className="gap-1.5">
          Suivante<ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
