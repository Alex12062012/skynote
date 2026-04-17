'use client'

import { useEffect, useState } from 'react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import type { RewardBreakdown } from '@/lib/gamification/rewards'
import { cn } from '@/lib/utils'

interface RewardToastProps {
  reward: RewardBreakdown | null
  onClose?: () => void
  /** ms avant auto-close (0 = ne pas fermer auto) */
  autoClose?: number
}

/**
 * Toast post-QCM — cartoon bounce + breakdown des bonus.
 * À afficher en fin de QcmEngine.
 */
export function RewardToast({ reward, onClose, autoClose = 0 }: RewardToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (reward) {
      setVisible(true)
      if (autoClose > 0) {
        const t = setTimeout(() => {
          setVisible(false)
          onClose?.()
        }, autoClose)
        return () => clearTimeout(t)
      }
    }
  }, [reward, autoClose, onClose])

  if (!reward || !visible) return null

  const { perfect, total, breakdown } = reward
  const none = total === 0

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center',
        'animate-fade-in bg-black/40 backdrop-blur-sm',
      )}
      onClick={() => { setVisible(false); onClose?.() }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-sm overflow-hidden rounded-card border-2 bg-white p-6 text-center shadow-2xl dark:bg-night-surface',
          perfect ? 'border-amber-400 animate-pop-in'
                  : none ? 'border-slate-300' : 'border-emerald-400 animate-pop-in',
        )}
      >
        {/* Confetti-like accent strip */}
        {perfect && (
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400" />
        )}

        <div className="mb-2 text-4xl">
          {perfect ? '🎯' : none ? '😅' : '✨'}
        </div>

        <h3 className={cn(
          'font-display text-h3 font-black',
          perfect ? 'text-amber-600' : none ? 'text-text-tertiary' : 'text-emerald-600',
        )}>
          {perfect ? 'PARFAIT !' : none ? 'Pas de récompense' : 'Bien joué !'}
        </h3>

        {!none && (
          <>
            <div className="my-4 flex items-center justify-center gap-2">
              <SkyCoin size={36} />
              <span className="font-display text-[42px] font-black tabular-nums text-text-main dark:text-text-dark-main">
                +{total}
              </span>
            </div>

            {breakdown.length > 1 && (
              <ul className="mx-auto max-w-[260px] space-y-1 rounded-input bg-sky-surface-2 p-3 text-left dark:bg-night-surface-2">
                {breakdown.map((b, i) => (
                  <li key={i} className="flex items-center justify-between font-body text-[13px]">
                    <span className="text-text-secondary dark:text-text-dark-secondary">{b.label}</span>
                    <span className="font-display font-bold tabular-nums text-text-main dark:text-text-dark-main">
                      +{b.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {none && (
          <p className="mt-2 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Il faut au moins 4/5 pour gagner des coins. Réessaie !
          </p>
        )}

        <button
          onClick={() => { setVisible(false); onClose?.() }}
          className="mt-5 w-full rounded-pill bg-brand py-2.5 font-display text-[15px] font-bold text-white shadow-btn transition-transform hover:scale-[1.02] active:scale-95"
        >
          Continuer
        </button>
      </div>
    </div>
  )
}
