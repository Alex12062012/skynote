'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getTodayCards } from '@/lib/supabase/eval-actions'
import { submitReview } from '@/lib/supabase/review-actions'
import { createClient } from '@/lib/supabase/client'
import { GRADE_COINS } from '@/lib/sm2'
import type { SM2Grade } from '@/lib/sm2'
import { CheckCircle, Coins, RotateCcw, ChevronRight, Lightbulb } from 'lucide-react'

type CardRow = { id: string; title: string; summary: string }

const GRADE_BUTTONS: { grade: SM2Grade; label: string; color: string }[] = [
  { grade: 0, label: 'À revoir',  color: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30' },
  { grade: 3, label: 'Difficile', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30' },
  { grade: 4, label: 'Bien',      color: 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30' },
  { grade: 5, label: 'Facile',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' },
]

export default function EvalSessionPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [cards, setCards] = useState<CardRow[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tip, setTip] = useState('')
  const [isLastDay, setIsLastDay] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const todayData = await getTodayCards(params.id)
      if (!todayData || todayData.cardIds.length === 0) {
        router.push(`/eval/${params.id}`)
        return
      }

      setTip(todayData.tip)
      setIsLastDay(todayData.isLastDay)

      const { data } = await supabase
        .from('flashcards')
        .select('id, title, summary')
        .in('id', todayData.cardIds)

      setCards((data as CardRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [params.id, router])

  function handleGrade(grade: SM2Grade) {
    const card = cards[index]
    if (!card) return

    startTransition(async () => {
      try {
        await submitReview(card.id, grade)
      } finally {
        setCoinsEarned(prev => prev + GRADE_COINS[grade])
        if (index + 1 >= cards.length) {
          setDone(true)
        } else {
          setIndex(i => i + 1)
          setFlipped(false)
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-bg dark:bg-night-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-sky-bg dark:bg-night-bg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-main dark:text-dark-main">Session terminée</h1>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-secondary">{cards.length} fiches révisées</p>
        </div>
        <div className="flex items-center gap-2 rounded-card bg-brand/10 border border-brand/20 px-4 py-2">
          <Coins className="h-4 w-4 text-brand" />
          <span className="text-sm font-semibold text-brand">+{coinsEarned} coins gagnés</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setDone(false); setIndex(0); setFlipped(false); setCoinsEarned(0) }}
            className="inline-flex h-11 items-center gap-2 rounded-input border border-white/10 bg-white/5 px-5 text-sm font-medium text-main dark:text-dark-main hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </button>
          <button
            onClick={() => router.push(`/eval/${params.id}`)}
            className="inline-flex h-11 items-center gap-2 rounded-input bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Voir le planning
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const card = cards[index]
  const progress = Math.round((index / cards.length) * 100)

  return (
    <div className="flex min-h-screen flex-col bg-sky-bg dark:bg-night-bg">
      {/* Progress */}
      <div className="h-1 w-full bg-white/5">
        <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-text-secondary dark:text-dark-secondary">{index + 1} / {cards.length}</span>
        <div className="flex items-center gap-1.5">
          {isLastDay && (
            <span className="text-xs font-medium text-orange-400 border border-orange-400/30 rounded-full px-2 py-0.5">Révision finale</span>
          )}
          <div className="flex items-center gap-1 text-sm text-brand ml-2">
            <Coins className="h-4 w-4" />
            <span>{coinsEarned}</span>
          </div>
        </div>
      </div>

      {/* Tip */}
      {tip && index === 0 && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2">
          <Lightbulb className="h-4 w-4 text-brand shrink-0" />
          <p className="text-xs text-text-secondary dark:text-dark-secondary italic">{tip}</p>
        </div>
      )}

      {/* Carte */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div
          className="relative w-full max-w-lg cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => !flipped && setFlipped(true)}
        >
          <div
            className="relative transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '260px',
            }}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-card bg-sky-surface dark:bg-night-surface p-8 text-center shadow-lg"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary dark:text-dark-tertiary mb-4">Question</p>
              <h2 className="font-display text-xl font-bold text-main dark:text-dark-main">{card.title}</h2>
              <p className="mt-6 text-xs text-text-tertiary dark:text-dark-tertiary">Appuie pour voir la réponse</p>
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-card bg-sky-surface dark:bg-night-surface p-8 text-center shadow-lg"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Réponse</p>
              <p className="text-base leading-relaxed text-main dark:text-dark-main">{card.summary}</p>
            </div>
          </div>
        </div>

        {flipped && (
          <div className="mt-8 grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            {GRADE_BUTTONS.map(({ grade, label, color }) => (
              <button
                key={grade}
                onClick={() => handleGrade(grade)}
                disabled={isPending}
                className={`h-12 rounded-input border text-sm font-semibold transition disabled:opacity-50 ${color}`}
              >
                {label}
                {GRADE_COINS[grade] > 0 && (
                  <span className="ml-1 text-xs opacity-60">+{GRADE_COINS[grade]}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
