'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ObjectiveBadge } from '@/components/ui/ObjectiveBadge'
import { toggleFlashcardMastered } from '@/lib/supabase/course-actions'
import { checkMasteryObjective } from '@/lib/supabase/objectives-actions'
import { cn } from '@/lib/utils'
import type { Flashcard } from '@/types/database'

interface FlashcardViewerProps {
  flashcards: Flashcard[]
  courseId: string
  userId: string
}

export function FlashcardViewer({ flashcards, courseId, userId }: FlashcardViewerProps) {
  const [index, setIndex] = useState(0)
  const [localCards, setLocalCards] = useState(flashcards)
  const [isPending, startTransition] = useTransition()
  const [showMasteryBadge, setShowMasteryBadge] = useState(false)

  const card = localCards[index]
  const mastered = localCards.filter((f) => f.is_mastered).length
  const total = localCards.length
  const keyPoints: string[] = Array.isArray(card.key_points)
    ? card.key_points
    : (() => { try { return JSON.parse(String(card.key_points || '[]')) } catch { return [] } })()

  function handleToggleMastered() {
    const newVal = !card.is_mastered
    const newCards = localCards.map((f) => f.id === card.id ? { ...f, is_mastered: newVal } : f)
    setLocalCards(newCards)

    startTransition(async () => {
      await toggleFlashcardMastered(card.id, newVal)

      // Vérifier si toutes les fiches sont maintenant maîtrisées
      const allMastered = newCards.every((f) => f.is_mastered)
      if (allMastered && newVal) {
        await checkMasteryObjective(courseId, userId)
        setShowMasteryBadge(true)
      }
    })
  }

  return (
    <>
      <ObjectiveBadge
        title="Maîtrise totale !"
        icon="🎓"
        coins={15}
        visible={showMasteryBadge}
        onHide={() => setShowMasteryBadge(false)}
      />

      <div className="flex flex-col gap-6">
        {/* Barre de maîtrise */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">Maîtrise</span>
            <span className="font-body text-[13px] font-semibold text-text-main dark:text-text-dark-main">
              {mastered} / {total}
              {mastered === total && <span className="ml-2 text-success dark:text-success-dark">🎓</span>}
            </span>
          </div>
          <ProgressBar value={mastered} max={total} showCoin />
        </div>

        {/* Miniatures */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {localCards.map((f, i) => (
            <button key={f.id} onClick={() => setIndex(i)}
              className={cn('flex-shrink-0 rounded-input px-3 py-1.5 font-body text-[12px] font-medium transition-all',
                i === index ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                  : f.is_mastered ? 'bg-success-soft text-success dark:bg-emerald-950/30 dark:text-success-dark'
                    : 'bg-sky-cloud text-text-secondary dark:bg-night-border dark:text-text-dark-secondary')}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Carte principale */}
        <div key={card.id}
          className="rounded-card border border-sky-border bg-sky-surface p-6 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark animate-fade-in">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <span className="font-body text-label-caps text-text-tertiary dark:text-text-dark-tertiary">
                Fiche {index + 1} / {total}
              </span>
              <h2 className="mt-1 font-display text-h3 text-text-main dark:text-text-dark-main">{card.title}</h2>
            </div>
            <button onClick={handleToggleMastered} disabled={isPending}
              className="flex-shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
              title={card.is_mastered ? 'Marquer non maîtrisée' : 'Marquer maîtrisée'}>
              {card.is_mastered
                ? <CheckCircle className="h-7 w-7 text-success dark:text-success-dark" />
                : <Circle className="h-7 w-7 text-sky-border dark:text-night-border" />}
            </button>
          </div>

          <p className="mb-5 font-body text-[15px] leading-relaxed text-text-secondary dark:text-text-dark-secondary">
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

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />Précédente
          </Button>
          <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">{index + 1} / {total}</span>
          <Button variant="secondary" size="sm" onClick={() => setIndex(Math.min(total - 1, index + 1))} disabled={index === total - 1} className="gap-1.5">
            Suivante<ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
