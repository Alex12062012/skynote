'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { QcmEngine } from './QcmEngine'
import { FlashcardQcmSelector } from './FlashcardQcmSelector'
import { DifficultySelector } from './DifficultySelector'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n/context'
import type { Flashcard, QcmQuestion } from '@/types/database'
import type { QcmDifficulty } from '@/lib/supabase/qcm-actions'

interface QcmPageClientProps {
  flashcards: Flashcard[]
  questionsByFlashcard: Record<string, QcmQuestion[]>
  courseId: string
}

export function QcmPageClient({ flashcards, questionsByFlashcard, courseId }: QcmPageClientProps) {
  const { t } = useI18n()
  const [selectedFlashcardId, setSelectedFlashcardId] = useState<string | null>(flashcards[0]?.id ?? null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [localQuestions, setLocalQuestions] = useState(questionsByFlashcard)
  const [difficulty, setDifficulty] = useState<QcmDifficulty | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const selectedFlashcard = flashcards.find((f) => f.id === selectedFlashcardId)
  const currentQuestions = selectedFlashcardId ? (localQuestions[selectedFlashcardId] ?? []) : []

  async function handleSelectFlashcard(id: string) {
    setSelectedFlashcardId(id)
    // Reset difficulty selection when changing flashcard
    setDifficulty(null)
  }

  async function handleRegenerate(diff?: QcmDifficulty) {
    if (!selectedFlashcardId) return
    setIsRegenerating(true); setRegenError(null)
    const usedDifficulty = diff ?? difficulty ?? 'medium'
    try {
      const res = await fetch('/api/generate-qcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: selectedFlashcardId, regenerate: true, difficulty: usedDifficulty }),
      })
      if (!res.ok) throw new Error('Error')
      const reloadRes = await fetch(`/api/qcm-questions?flashcardId=${selectedFlashcardId}`)
      if (reloadRes.ok) {
        const data = await reloadRes.json()
        setLocalQuestions((prev) => ({ ...prev, [selectedFlashcardId]: data.questions }))
      } else {
        window.location.reload()
      }
    } catch { setRegenError(t('qcm.regenError')) }
    finally { setIsRegenerating(false) }
  }

  async function handleDifficultySelect(diff: QcmDifficulty) {
    if (!selectedFlashcardId) return
    setIsStarting(true)
    setDifficulty(diff)

    // Always regenerate questions for the chosen difficulty
    try {
      const res = await fetch('/api/generate-qcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: selectedFlashcardId, regenerate: true, difficulty: diff }),
      })
      if (res.ok) {
        const reloadRes = await fetch(`/api/qcm-questions?flashcardId=${selectedFlashcardId}`)
        if (reloadRes.ok) {
          const data = await reloadRes.json()
          setLocalQuestions((prev) => ({ ...prev, [selectedFlashcardId]: data.questions }))
        }
      }
    } catch {
      // If regeneration fails, use existing questions
    } finally {
      setIsStarting(false)
    }
  }

  function handleRestartWithNewDifficulty() {
    setDifficulty(null)
  }

  return (
    <div className="flex flex-col gap-8">
      {flashcards.length > 1 && (
        <FlashcardQcmSelector
          flashcards={flashcards}
          selectedId={selectedFlashcardId}
          onSelect={handleSelectFlashcard}
        />
      )}

      {selectedFlashcard && (
        <div>
          {/* Header with regen button — only visible after difficulty is chosen */}
          {difficulty && (
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-h4 font-semibold text-text-main dark:text-text-dark-main">{selectedFlashcard.title}</h2>
                <p className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                  {t('qcm.aiGenerated').replace('{n}', String(currentQuestions.length))}
                </p>
              </div>
              <button
                onClick={() => handleRegenerate()}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 font-body text-[13px] text-text-tertiary hover:text-brand dark:hover:text-brand-dark transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? t('qcm.regenerating') : t('qcm.regenerate')}
              </button>
            </div>
          )}

          {regenError && <p className="mb-3 font-body text-[13px] text-error">{regenError}</p>}

          {/* Loading state while generating questions */}
          {isStarting || isRegenerating ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-fade-in">
              <div className="h-10 w-10 rounded-full border-[3px] border-brand border-t-transparent animate-spin dark:border-brand-dark" />
              <p className="font-display text-[16px] font-bold text-text-main dark:text-text-dark-main">
                Préparation de ton QCM...
              </p>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                L'IA génère des questions {difficulty === 'easy' ? '🌿 Paisibles' : difficulty === 'hard' ? '💀 Hardcore' : '⚡ Normales'} ✨
              </p>
            </div>
          ) : !difficulty ? (
            /* Difficulty selector — shown first */
            currentQuestions.length > 0 ? (
              <DifficultySelector
                flashcardTitle={selectedFlashcard.title}
                onSelect={handleDifficultySelect}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 text-4xl">{'\u23F3'}</div>
                <h3 className="font-display text-h4 font-semibold text-text-main dark:text-text-dark-main">{t('qcm.notAvailable')}</h3>
                <p className="mt-2 max-w-xs font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">{t('qcm.notAvailableDesc')}</p>
                <Button onClick={() => handleRegenerate('medium')} loading={isRegenerating} className="mt-4 gap-2" variant="secondary">
                  <RefreshCw className="h-4 w-4" />{t('qcm.generateQuestions')}
                </Button>
              </div>
            )
          ) : (
            /* QCM Engine */
            currentQuestions.length > 0 ? (
              <QcmEngine
                key={`${selectedFlashcardId}-${difficulty}-${currentQuestions.length}`}
                flashcard={selectedFlashcard}
                questions={currentQuestions}
                courseId={courseId}
                difficulty={difficulty}
                onRegenerate={() => handleRegenerate()}
                onChangeDifficulty={handleRestartWithNewDifficulty}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 text-4xl">⚠️</div>
                <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
                  Impossible de charger les questions. Réessaie.
                </p>
                <Button onClick={() => handleRegenerate()} loading={isRegenerating} className="mt-4 gap-2" variant="secondary">
                  <RefreshCw className="h-4 w-4" />Réessayer
                </Button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
