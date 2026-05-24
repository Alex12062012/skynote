'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { QcmEngine } from './QcmEngine'
import { FlashcardQcmSelector } from './FlashcardQcmSelector'
import { DifficultySelector } from './DifficultySelector'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n/context'
import type { Flashcard, QcmQuestion } from '@/types/database'
import type { QcmDifficulty } from '@/lib/supabase/qcm-actions'

interface QcmPageClientProps {
  flashcards: Flashcard[]
  allQuestions: QcmQuestion[]
  courseId: string
}

export function QcmPageClient({ flashcards, allQuestions, courseId }: QcmPageClientProps) {
  const { t } = useI18n()
  const searchParams = useSearchParams()

  // Lire le param ?fiche=N pour pré-sélectionner la bonne fiche
  // (transmis par le bouton "QCM fiche N" dans FlashcardViewer)
  const ficheParam = searchParams.get('fiche')
  const initialIndex = ficheParam !== null ? parseInt(ficheParam, 10) : 0
  const safeInitialIndex = Number.isFinite(initialIndex)
    ? Math.max(0, Math.min(initialIndex, flashcards.length - 1))
    : 0
  const initialFlashcardId = flashcards[safeInitialIndex]?.id ?? flashcards[0]?.id ?? null

  const [selectedFlashcardId, setSelectedFlashcardId] = useState<string | null>(initialFlashcardId)
  const [difficulty, setDifficulty] = useState<QcmDifficulty | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [localOverrides, setLocalOverrides] = useState<Record<string, Record<QcmDifficulty, QcmQuestion[]>>>({})

  const selectedFlashcard = flashcards.find((f) => f.id === selectedFlashcardId)

  function getQuestions(flashcardId: string, diff: QcmDifficulty): QcmQuestion[] {
    const override = localOverrides[flashcardId]?.[diff]
    if (override && override.length > 0) return override
    return allQuestions.filter(
      (q) => q.flashcard_id === flashcardId && q.difficulty === diff
    )
  }

  async function handleSelectFlashcard(id: string) {
    setSelectedFlashcardId(id)
    setDifficulty(null)
    setRegenError(null)
  }

  function handleDifficultySelect(diff: QcmDifficulty) {
    setDifficulty(diff)
    setRegenError(null)
  }

  async function handleRegenerate() {
    if (!selectedFlashcardId || !difficulty) return
    setIsRegenerating(true)
    setRegenError(null)
    try {
      const res = await fetch('/api/generate-qcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: selectedFlashcardId, regenerate: true, difficulty }),
      })
      if (!res.ok) throw new Error('Erreur lors de la régénération')
      const reloadRes = await fetch(`/api/qcm-questions?flashcardId=${selectedFlashcardId}&difficulty=${difficulty}`)
      if (reloadRes.ok) {
        const data = await reloadRes.json()
        setLocalOverrides((prev) => ({
          ...prev,
          [selectedFlashcardId]: {
            ...(prev[selectedFlashcardId] ?? {}),
            [difficulty]: data.questions,
          },
        }))
      }
    } catch {
      setRegenError(t('qcm.regenError'))
    } finally {
      setIsRegenerating(false)
    }
  }

  function handleRestartWithNewDifficulty() {
    setDifficulty(null)
    setRegenError(null)
  }

  const currentQuestions = selectedFlashcardId && difficulty
    ? getQuestions(selectedFlashcardId, difficulty)
    : []

  return (
    <div className="flex flex-col gap-6">
      {flashcards.length > 1 && (
        <FlashcardQcmSelector
          flashcards={flashcards}
          selectedId={selectedFlashcardId}
          onSelect={handleSelectFlashcard}
        />
      )}

      {selectedFlashcard && (
        <div>
          {difficulty && (
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-h4 font-semibold text-text-main dark:text-text-dark-main">
                  {selectedFlashcard.title}
                </h2>
                <p className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                  {currentQuestions.length} question{currentQuestions.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 font-body text-[13px] text-text-tertiary hover:text-brand dark:hover:text-brand-dark transition-colors disabled:opacity-50"
              >
                {isRegenerating
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />
                }
                {isRegenerating ? 'Régénération...' : 'Régénérer'}
              </button>
            </div>
          )}

          {regenError && (
            <div className="mb-3 flex items-center gap-2 font-body text-[13px] text-error">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {regenError}
            </div>
          )}

          {isRegenerating ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-fade-in">
              <div className="h-10 w-10 rounded-full border-[3px] border-brand border-t-transparent animate-spin dark:border-brand-dark" />
              <p className="font-display text-[16px] font-bold text-text-main dark:text-text-dark-main">
                Régénération en cours...
              </p>
            </div>
          ) : !difficulty ? (
            <DifficultySelector
              flashcardTitle={selectedFlashcard.title}
              onSelect={handleDifficultySelect}
            />
          ) : currentQuestions.length > 0 ? (
            <QcmEngine
              key={`${selectedFlashcardId}-${difficulty}`}
              flashcard={selectedFlashcard}
              questions={currentQuestions}
              courseId={courseId}
              difficulty={difficulty}
              onRegenerate={handleRegenerate}
              onChangeDifficulty={handleRestartWithNewDifficulty}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <AlertCircle className="h-10 w-10 text-text-tertiary dark:text-text-dark-tertiary" />
              <div>
                <h3 className="font-display text-h4 font-semibold text-text-main dark:text-text-dark-main">
                  Questions non disponibles
                </h3>
                <p className="mt-1 max-w-xs font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
                  Les questions pour ce niveau n'ont pas pu être chargées.
                </p>
              </div>
              <Button onClick={handleRegenerate} loading={isRegenerating} variant="secondary" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Générer les questions
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
