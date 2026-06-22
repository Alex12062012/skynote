'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CheckCircle, Circle, GraduationCap, Zap, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ObjectiveBadge } from '@/components/ui/ObjectiveBadge'
import { toggleFlashcardMastered } from '@/lib/supabase/course-actions'
import { checkMasteryObjective } from '@/lib/supabase/objectives-actions'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import type { Flashcard } from '@/types/database'

interface FlashcardViewerProps {
  flashcards: Flashcard[]
  courseId: string
  userId: string
  /** Passer true si un QCM est disponible pour ce cours */
  qcmReady?: boolean
}

export function FlashcardViewer({ flashcards, courseId, userId, qcmReady = false }: FlashcardViewerProps) {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)
  const [localCards, setLocalCards] = useState(flashcards)
  const [isPending, startTransition] = useTransition()
  const [showMasteryBadge, setShowMasteryBadge] = useState(false)

  function handleShare() {
    const url = `${window.location.origin}/cours/${courseId}`

    // Sur mobile (iOS/Android) : ouvre le menu de partage natif (Messages, WhatsApp, Mail...)
    if (navigator.share) {
      navigator.share({ title: 'Mon cours Skynote', url }).catch(() => {
        // L'utilisateur a annulé le partage, ou l'API a échoué — on ne fait rien
      })
      return
    }

    // Desktop / navigateurs sans support : on copie le lien dans le presse-papiers
    navigator.clipboard.writeText(url)
  }

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
        icon={<GraduationCap className="h-6 w-6 text-success dark:text-success-dark" />}
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
              {mastered === total && <GraduationCap className="ml-2 inline h-4 w-4 text-success dark:text-success-dark" />}
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
            <div className="flex flex-shrink-0 items-center gap-2">
              <button onClick={handleShare}
                className="flex items-center gap-1.5 rounded-input border border-sky-border px-2.5 py-1.5 font-body text-[12px] text-text-secondary transition-all hover:border-brand hover:text-brand dark:border-night-border dark:text-text-dark-secondary dark:hover:border-brand-dark dark:hover:text-brand-dark"
                title="Partager le cours">
                <Share2 className="h-3.5 w-3.5" />Partager
              </button>
              <button onClick={handleToggleMastered} disabled={isPending}
                className="transition-transform hover:scale-110 disabled:opacity-50"
                title={card.is_mastered ? 'Marquer non maîtrisée' : 'Marquer maîtrisée'}>
                {card.is_mastered
                  ? <CheckCircle className="h-7 w-7 text-success dark:text-success-dark" />
                  : <Circle className="h-7 w-7 text-sky-border dark:text-night-border" />}
              </button>
            </div>
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

        {/* Navigation + bouton QCM contextuel */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />Précédente
          </Button>

          {/* Bouton QCM lié à la fiche courante — ?fiche=N pour pré-sélectionner dans QcmPageClient */}
          {qcmReady && (
            <Link href={`/courses/${courseId}/qcm?fiche=${index}`}>
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
    </>
  )
}
