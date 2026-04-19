'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, RotateCcw, ChevronRight, Star, Coins } from 'lucide-react'
import { getDueCards, submitReview } from '@/lib/supabase/review-actions'
import type { DueCard } from '@/lib/supabase/review-actions'
import type { SM2Grade } from '@/lib/sm2'
import { GRADE_COINS } from '@/lib/sm2'

// ============================================================
// TYPES LOCAUX
// ============================================================

type GradeResult = { grade: SM2Grade; coins: number }

type SessionStats = {
  total: number
  grades: Record<SM2Grade, number>
  coinsEarned: number
}

// ============================================================
// BOUTONS DE GRADE
// ============================================================

const GRADE_BUTTONS: { grade: SM2Grade; label: string; color: string }[] = [
  { grade: 0, label: 'À revoir',  color: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30' },
  { grade: 3, label: 'Difficile', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30' },
  { grade: 4, label: 'Bien',      color: 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30' },
  { grade: 5, label: 'Facile',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' },
]

// ============================================================
// ÉCRAN DE FIN
// ============================================================

function SessionEnd({ stats, onRestart }: { stats: SessionStats; onRestart: () => void }) {
  const router = useRouter()
  const successRate = stats.total > 0
    ? Math.round(((stats.grades[4] + stats.grades[5]) / stats.total) * 100)
    : 0

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 bg-sky-bg dark:bg-night-bg">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
        <CheckCircle className="h-8 w-8 text-emerald-400" />
      </div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-main dark:text-dark-main">Session terminée</h1>
        <p className="mt-2 text-text-secondary dark:text-dark-secondary">{stats.total} carte{stats.total > 1 ? 's' : ''} révisée{stats.total > 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        <div className="rounded-card bg-sky-surface dark:bg-night-surface p-4 text-center">
          <p className="text-2xl font-bold text-main dark:text-dark-main">{successRate}%</p>
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-secondary">Réussite</p>
        </div>
        <div className="rounded-card bg-sky-surface dark:bg-night-surface p-4 text-center">
          <p className="text-2xl font-bold text-brand">{stats.coinsEarned}</p>
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-secondary">Coins</p>
        </div>
        <div className="rounded-card bg-sky-surface dark:bg-night-surface p-4 text-center">
          <p className="text-2xl font-bold text-main dark:text-dark-main">{stats.grades[5]}</p>
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-secondary">Facile</p>
        </div>
      </div>

      {/* Répartition grades */}
      <div className="w-full max-w-sm space-y-2">
        {GRADE_BUTTONS.map(({ grade, label, color }) => (
          <div key={grade} className="flex items-center gap-3">
            <span className={`w-20 rounded-full border px-2 py-0.5 text-center text-xs font-medium ${color}`}>{label}</span>
            <div className="flex-1 rounded-full bg-white/5 h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: stats.total > 0 ? `${(stats.grades[grade] / stats.total) * 100}%` : '0%' }}
              />
            </div>
            <span className="w-6 text-right text-sm text-text-secondary dark:text-dark-secondary">{stats.grades[grade]}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="inline-flex h-11 items-center gap-2 rounded-input border border-white/10 bg-white/5 px-5 text-sm font-medium text-main dark:text-dark-main hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
          Recommencer
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex h-11 items-center gap-2 rounded-input bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Dashboard
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function ReviewPage() {
  const [cards, setCards] = useState<DueCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    grades: { 0: 0, 3: 0, 4: 0, 5: 0 },
    coinsEarned: 0,
  })
  const [done, setDone] = useState(false)

  async function loadCards() {
    setLoading(true)
    setDone(false)
    setIndex(0)
    setFlipped(false)
    setStats({ total: 0, grades: { 0: 0, 3: 0, 4: 0, 5: 0 }, coinsEarned: 0 })
    const data = await getDueCards()
    setCards(data)
    setLoading(false)
  }

  useEffect(() => { loadCards() }, [])

  function handleGrade(grade: SM2Grade) {
    const card = cards[index]
    if (!card) return

    startTransition(async () => {
      try {
        await submitReview(card.id, grade)
      } finally {
        const coins = GRADE_COINS[grade]
        setStats(prev => ({
          total: prev.total + 1,
          grades: { ...prev.grades, [grade]: prev.grades[grade] + 1 },
          coinsEarned: prev.coinsEarned + coins,
        }))

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

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sky-bg dark:bg-night-bg px-4 text-center">
        <Star className="h-12 w-12 text-brand" />
        <h1 className="font-display text-2xl font-bold text-main dark:text-dark-main">Tout est à jour</h1>
        <p className="text-text-secondary dark:text-dark-secondary">Aucune carte à réviser aujourd'hui.</p>
      </div>
    )
  }

  if (done) {
    return <SessionEnd stats={stats} onRestart={loadCards} />
  }

  const card = cards[index]
  const progress = Math.round((index / cards.length) * 100)

  return (
    <div className="flex min-h-screen flex-col bg-sky-bg dark:bg-night-bg">
      {/* Progress bar */}
      <div className="h-1 w-full bg-white/5">
        <div
          className="h-full bg-brand transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-text-secondary dark:text-dark-secondary">
          {index + 1} / {cards.length}
        </span>
        <div className="flex items-center gap-1.5 text-sm text-brand">
          <Coins className="h-4 w-4" />
          <span>{stats.coinsEarned}</span>
        </div>
      </div>

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
            {/* Recto */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-card bg-sky-surface dark:bg-night-surface p-8 text-center shadow-lg"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary dark:text-dark-tertiary mb-4">Question</p>
              <h2 className="font-display text-xl font-bold text-main dark:text-dark-main">{card.title}</h2>
              <p className="mt-6 text-xs text-text-tertiary dark:text-dark-tertiary">Appuie pour voir la réponse</p>
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-card bg-sky-surface dark:bg-night-surface p-8 text-center shadow-lg"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Réponse</p>
              <p className="text-base leading-relaxed text-main dark:text-dark-main">{card.summary}</p>
            </div>
          </div>
        </div>

        {/* Boutons grade */}
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
