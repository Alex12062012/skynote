'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Zap, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { CoinAnimation, CoinToast } from '@/components/ui/CoinAnimation'
import { useCoinReward } from '@/components/providers/CoinRewardProvider'
import { saveQcmAttempt } from '@/lib/supabase/qcm-actions'
import { cn } from '@/lib/utils'
import type { QcmQuestion, Flashcard } from '@/types/database'

interface QcmEngineProps {
  flashcard: Flashcard
  questions: QcmQuestion[]
  courseId: string
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect'
interface UserAnswer { questionIndex: number; chosenIndex: number; correct: boolean }

export function QcmEngine({ flashcard, questions, courseId }: QcmEngineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered')
  const [showResult, setShowResult] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const { showReward } = useCoinReward()
  const [showCoinAnim, setShowCoinAnim] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const question = questions[currentQ]
  const total = questions.length
  const options: string[] = Array.isArray(question?.options)
    ? question.options
    : (() => { try { return JSON.parse(String(question?.options || '[]')) } catch { return [] } })()

  function handleOptionClick(i: number) {
    if (answerState !== 'unanswered') return
    setSelectedOption(i)
    setAnswerState(i === question.correct_index ? 'correct' : 'incorrect')
  }

  function handleNext() {
    if (selectedOption === null) return
    const newAnswers = [...answers, {
      questionIndex: currentQ,
      chosenIndex: selectedOption,
      correct: selectedOption === question.correct_index,
    }]
    setAnswers(newAnswers)
    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1)
      setSelectedOption(null)
      setAnswerState('unanswered')
    } else {
      const finalScore = newAnswers.filter((a) => a.correct).length
      startTransition(async () => {
        const { coinsEarned: earned } = await saveQcmAttempt({
          flashcardId: flashcard.id,
          score: finalScore,
          total,
          answers: newAnswers.map((a) => a.chosenIndex),
        })
        setCoinsEarned(earned)
        if (earned > 0) { showReward({ amount: earned, reason: 'Score parfait au QCM !', icon: '⚡' }) }
        setShowResult(true)
      })
    }
  }

  function handleRestart() {
    setCurrentQ(0); setAnswers([]); setSelectedOption(null)
    setAnswerState('unanswered'); setShowResult(false)
    setCoinsEarned(0); setShowCoinAnim(false); setShowToast(false)
  }

  // ── Résultats ──────────────────────────────────────────────
  if (showResult) {
    const finalScore = answers.filter((a) => a.correct).length
    const isPerfect = finalScore === total
    const pct = Math.round((finalScore / total) * 100)
    return (
      <>
        <CoinAnimation trigger={showCoinAnim} count={14} onDone={() => setShowCoinAnim(false)} />
        <CoinToast amount={coinsEarned} visible={showToast} onHide={() => setShowToast(false)} />
        <div className="flex flex-col items-center gap-6 py-8 text-center animate-fade-in">
          <div className={cn('flex h-24 w-24 items-center justify-center rounded-full animate-pop-in',
            isPerfect ? 'bg-success-soft dark:bg-emerald-950/30'
              : pct >= 60 ? 'bg-brand-soft dark:bg-brand-dark-soft'
                : 'bg-red-50 dark:bg-red-950/20')}>
            <span className="text-5xl">{isPerfect ? '🏆' : pct >= 60 ? '⭐' : '📚'}</span>
          </div>
          <div>
            <h2 className="font-display text-h2 text-text-main dark:text-text-dark-main">
              {isPerfect ? 'Score parfait !' : pct >= 60 ? 'Bon travail !' : 'Continue à réviser !'}
            </h2>
            <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
              <strong className="text-text-main dark:text-text-dark-main">{finalScore}/{total}</strong> bonnes réponses · {pct}%
            </p>
          </div>
          <div className="flex gap-2">
            {answers.map((a, i) => (
              <div key={i} className={cn('flex h-10 w-10 items-center justify-center rounded-full font-body text-[13px] font-bold',
                a.correct ? 'bg-success-soft text-success dark:bg-emerald-950/30 dark:text-success-dark' : 'bg-red-50 text-error dark:bg-red-950/20')}>
                {a.correct ? '✓' : '✗'}
              </div>
            ))}
          </div>
          {coinsEarned > 0 && (
            <div className="flex items-center gap-2 rounded-pill bg-brand-soft px-5 py-2.5 animate-pop-in dark:bg-brand-dark-soft">
              <SkyCoin size={24} />
              <span className="font-body text-[15px] font-bold text-brand dark:text-brand-dark">+{coinsEarned} Sky Coins !</span>
            </div>
          )}
          {!isPerfect && (
            <p className="max-w-xs font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              {pct < 60 ? 'Relis les fiches puis réessaie ! 💪' : 'Encore un effort pour le score parfait !'}
            </p>
          )}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={handleRestart} className="w-full gap-2"><RotateCcw className="h-4 w-4" />Recommencer</Button>
            <Button onClick={() => router.push(`/courses/${courseId}`)} variant="secondary" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />Retour aux fiches
            </Button>
          </div>
        </div>
      </>
    )
  }

  // ── Question en cours — layout fixe avec bouton toujours visible ──
  return (
    <div className="flex flex-col gap-0 animate-fade-in">

      {/* Zone scrollable : progression + question + options + explication */}
      <div className="flex flex-col gap-4 pb-4">

        {/* Progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
              Question {currentQ + 1} / {total}
            </span>
            <span className="font-body text-[13px] font-semibold text-success dark:text-success-dark">
              {answers.filter((a) => a.correct).length} correctes
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
            <div className="h-full rounded-pill transition-all duration-500"
              style={{ width: `${(currentQ / total) * 100}%`, background: 'linear-gradient(90deg,#2563EB,#60A5FA)' }} />
          </div>
        </div>

        {/* Question */}
        <div className="rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
          <p className="font-body text-label-caps text-text-tertiary dark:text-text-dark-tertiary mb-1.5">
            {flashcard.title}
          </p>
          <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main leading-snug">
            {question.question}
          </h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {options.map((option, index) => {
            const isSelected = selectedOption === index
            const isCorrect = index === question.correct_index
            const isAnswered = answerState !== 'unanswered'
            let cls = ''
            if (isAnswered) {
              if (isCorrect) cls = 'border-success bg-success-soft text-success dark:border-success-dark dark:bg-emerald-950/30 dark:text-success-dark'
              else if (isSelected) cls = 'border-error bg-red-50 text-error dark:bg-red-950/20 dark:border-error'
              else cls = 'border-sky-border opacity-40 dark:border-night-border'
            } else {
              cls = 'border-sky-border hover:border-brand hover:bg-brand-soft/40 dark:border-night-border dark:hover:border-brand-dark dark:hover:bg-brand-dark-soft/20 cursor-pointer'
            }
            return (
              <button key={index} onClick={() => handleOptionClick(index)} disabled={isAnswered}
                className={cn('flex w-full items-center gap-3 rounded-card-sm border-[1.5px] px-4 py-3 text-left transition-all duration-150', cls)}>
                <span className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-body text-[12px] font-bold',
                  isAnswered && isCorrect ? 'bg-success text-white dark:bg-success-dark'
                    : isAnswered && isSelected ? 'bg-error text-white'
                      : 'bg-sky-cloud text-brand dark:bg-night-border dark:text-brand-dark')}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 font-body text-[14px] leading-snug">{option}</span>
                {isAnswered && isCorrect && <CheckCircle className="h-4 w-4 flex-shrink-0 text-success dark:text-success-dark" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 flex-shrink-0 text-error" />}
              </button>
            )
          })}
        </div>

        {/* Explication — hauteur fixe pour éviter le saut */}
        <div className="min-h-[72px]">
          {answerState !== 'unanswered' && (
            <div className={cn('rounded-input px-4 py-3 animate-slide-in',
              answerState === 'correct'
                ? 'bg-success-soft border border-success/20 dark:bg-emerald-950/20 dark:border-emerald-800/30'
                : 'bg-red-50 border border-error/20 dark:bg-red-950/20 dark:border-red-800/30')}>
              <p className="font-body text-[12px] font-semibold mb-0.5 dark:text-text-dark-main">
                {answerState === 'correct' ? '✓ Bonne réponse !' : '✗ Pas tout à fait...'}
              </p>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bouton Suivant — TOUJOURS en bas, visible sans scroller */}
      <div className="sticky bottom-4 mt-2">
        <Button
          onClick={handleNext}
          loading={isPending}
          disabled={answerState === 'unanswered'}
          size="lg"
          className={cn(
            'w-full gap-2 transition-all duration-200',
            answerState === 'unanswered' ? 'opacity-40' : 'opacity-100 shadow-btn'
          )}
        >
          {currentQ < total - 1
            ? 'Question suivante →'
            : <><Zap className="h-5 w-5" />Voir mes résultats</>
          }
        </Button>
      </div>
    </div>
  )
}
