'use client'

import { cn } from '@/lib/utils'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { Button } from '@/components/ui/Button'
import type { QcmDifficulty } from '@/lib/supabase/qcm-actions'

interface DifficultySelectorProps {
  flashcardTitle: string
  onSelect: (difficulty: QcmDifficulty) => void
  isLoading?: boolean
}

const DIFFICULTIES: {
  key: QcmDifficulty
  label: string
  emoji: string
  description: string
  coins: number
  color: string
  bgLight: string
  bgDark: string
  borderLight: string
  borderDark: string
}[] = [
  {
    key: 'easy',
    label: 'Paisible',
    emoji: '🌿',
    description: 'Questions directes sur les définitions et faits principaux.',
    coins: 1,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/30',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800/40',
  },
  {
    key: 'medium',
    label: 'Normal',
    emoji: '⚡',
    description: 'Questions de compréhension avec des pièges plausibles.',
    coins: 3,
    color: 'text-brand dark:text-brand-dark',
    bgLight: 'bg-brand-soft',
    bgDark: 'dark:bg-brand-dark-soft',
    borderLight: 'border-brand/30',
    borderDark: 'dark:border-brand-dark/30',
  },
  {
    key: 'hard',
    label: 'Hardcore',
    emoji: '💀',
    description: 'Questions avancées avec pièges subtils. Maîtrise totale requise.',
    coins: 5,
    color: 'text-red-600 dark:text-red-400',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-950/20',
    borderLight: 'border-red-200',
    borderDark: 'dark:border-red-800/40',
  },
]

export function DifficultySelector({ flashcardTitle, onSelect, isLoading }: DifficultySelectorProps) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft mx-auto mb-4">
          <span className="text-3xl">🎯</span>
        </div>
        <h2 className="font-display text-h3 font-semibold text-text-main dark:text-text-dark-main">
          Choisis ton niveau
        </h2>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary max-w-xs mx-auto">
          Les questions seront adaptées à ta fiche <strong className="text-text-main dark:text-text-dark-main">{flashcardTitle}</strong>
        </p>
      </div>

      {/* Difficulty cards */}
      <div className="flex flex-col gap-3">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            onClick={() => !isLoading && onSelect(d.key)}
            disabled={isLoading}
            className={cn(
              'group flex items-center gap-4 rounded-card border-[1.5px] p-4 text-left transition-all duration-150',
              d.bgLight, d.bgDark, d.borderLight, d.borderDark,
              'hover:scale-[1.01] hover:shadow-md active:scale-[0.99]',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Emoji */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-white/5 shadow-sm text-2xl">
              {d.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn('font-display text-[16px] font-bold', d.color)}>
                  {d.label}
                </span>
              </div>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary leading-snug">
                {d.description}
              </p>
            </div>

            {/* Coins reward */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className="flex items-center gap-1">
                <SkyCoin size={18} />
                <span className={cn('font-body text-[15px] font-bold', d.color)}>
                  +{d.coins}
                </span>
              </div>
              <span className="font-body text-[10px] text-text-tertiary dark:text-text-dark-tertiary whitespace-nowrap">
                si 5/5
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-center font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
        Les questions seront générées par l'IA selon le niveau choisi ✨
      </p>
    </div>
  )
}
