'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { QcmEngine } from './QcmEngine'
import { FlashcardQcmSelector } from './FlashcardQcmSelector'
import { Button } from '@/components/ui/Button'
import type { Flashcard, QcmQuestion } from '@/types/database'

interface QcmPageClientProps {
  flashcards: Flashcard[]
  questionsByFlashcard: Record<string, QcmQuestion[]>
  courseId: string
}

export function QcmPageClient({ flashcards, questionsByFlashcard, courseId }: QcmPageClientProps) {
  const [selectedFlashcardId, setSelectedFlashcardId] = useState<string | null>(
    flashcards[0]?.id ?? null
  )
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [localQuestions, setLocalQuestions] = useState(questionsByFlashcard)

  const selectedFlashcard = flashcards.find((f) => f.id === selectedFlashcardId)
  const currentQuestions = selectedFlashcardId ? (localQuestions[selectedFlashcardId] ?? []) : []

  async function handleRegenerate() {
    if (!selectedFlashcardId) return
    setIsRegenerating(true)
    setRegenError(null)
    try {
      const res = await fetch('/api/generate-qcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: selectedFlashcardId }),
      })
      if (!res.ok) throw new Error('Erreur lors de la régénération')
      // Recharger les questions
      const reloadRes = await fetch(`/api/qcm-questions?flashcardId=${selectedFlashcardId}`)
      if (reloadRes.ok) {
        const data = await reloadRes.json()
        setLocalQuestions((prev) => ({ ...prev, [selectedFlashcardId]: data.questions }))
      } else {
        window.location.reload()
      }
    } catch {
      setRegenError('Impossible de régénérer les questions.')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Sélecteur de fiche (si plusieurs) */}
      {flashcards.length > 1 && (
        <FlashcardQcmSelector
          flashcards={flashcards}
          selectedId={selectedFlashcardId}
          onSelect={(id) => setSelectedFlashcardId(id)}
        />
      )}

      {/* Zone QCM */}
      {selectedFlashcard && currentQuestions.length > 0 ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-h4 font-semibold text-text-main dark:text-text-dark-main">
                {selectedFlashcard.title}
              </h2>
              <p className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                {currentQuestions.length} questions générées par l'IA
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 font-body text-[13px] text-text-tertiary hover:text-brand dark:hover:text-brand-dark transition-colors disabled:opacity-50"
              title="Régénérer les questions"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Régénération...' : 'Régénérer'}
            </button>
          </div>

          {regenError && (
            <p className="mb-3 font-body text-[13px] text-error">{regenError}</p>
          )}

          <QcmEngine
            key={`${selectedFlashcardId}-${currentQuestions.length}`}
            flashcard={selectedFlashcard}
            questions={currentQuestions}
            courseId={courseId}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <h3 className="font-display text-h4 font-semibold text-text-main dark:text-text-dark-main">
            Questions non disponibles
          </h3>
          <p className="mt-2 max-w-xs font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Les questions pour cette fiche n'ont pas encore été générées.
          </p>
          <Button
            onClick={handleRegenerate}
            loading={isRegenerating}
            className="mt-4 gap-2"
            variant="secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Générer les questions
          </Button>
        </div>
      )}
    </div>
  )
}
