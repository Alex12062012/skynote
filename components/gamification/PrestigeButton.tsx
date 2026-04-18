'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, PartyPopper } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { cn } from '@/lib/utils'
import { doPrestige } from '@/lib/supabase/gamification-actions'
import { PrestigeBadge } from './PrestigeBadge'

interface PrestigeButtonProps {
  currentLevel: number
  currentCoins: number
  nextCost: number
  /** badge équipé actuellement (pour l'aperçu dans l'hexagone) */
  badgeId?: string
  /** lettre fallback (première lettre du pseudo) */
  letter?: string
}

export function PrestigeButton({
  currentLevel, currentCoins, nextCost,
  badgeId = 'letter', letter = '?',
}: PrestigeButtonProps) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<number | null>(null)

  const canAfford = currentCoins >= nextCost

  const handlePrestige = () => {
    start(async () => {
      setError(null)
      const res = await doPrestige()
      if (res.error) setError(res.error)
      else {
        setSuccess(res.newPrestige ?? currentLevel + 1)
        setTimeout(() => router.refresh(), 1500)
      }
      setConfirming(false)
    })
  }

  return (
    <div className="rounded-card border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-5 dark:border-purple-800 dark:from-purple-950/30 dark:to-pink-950/30">
      <div className="flex items-start gap-4">
        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <PrestigeBadge
            level={currentLevel + 1}
            badgeId={badgeId}
            letter={letter}
            size="lg"
            animated
          />
          <p className="font-display text-[12px] font-bold text-purple-700 dark:text-purple-300">
            Prestige {currentLevel + 1}
          </p>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-h4 font-black text-purple-900 dark:text-purple-200">
            Ascension disponible
          </h3>
          <p className="mt-1 font-body text-[13px] text-purple-800/80 dark:text-purple-200/70">
            Reset tes coins contre un chevron permanent, un titre <em>Renaissance {currentLevel + 1}</em>, et
            <strong> +{(currentLevel + 1) * 5}% </strong>
            de gain sur tous tes futurs QCM.
          </p>

          {!success && (
            <div className="mt-3 flex items-center gap-2">
              <SkyCoin size={18} />
              <span className="font-display text-[16px] font-black tabular-nums text-purple-900 dark:text-purple-100">
                {nextCost.toLocaleString('fr-FR')}
              </span>
              <span className="font-body text-[13px] text-purple-800/60 dark:text-purple-200/60">
                ({currentCoins.toLocaleString('fr-FR')} disponibles)
              </span>
            </div>
          )}

          {!confirming && !success && (
            <button
              disabled={!canAfford || pending}
              onClick={() => setConfirming(true)}
              className={cn(
                'mt-4 inline-flex items-center gap-2 rounded-pill px-5 py-2 font-display text-[14px] font-bold transition-all',
                canAfford
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-btn hover:scale-[1.02] active:scale-95'
                  : 'cursor-not-allowed bg-sky-cloud text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary',
              )}
            >
              <Sparkles className="h-4 w-4" />
              {canAfford ? 'Prestige maintenant' : 'Coins insuffisants'}
            </button>
          )}

          {confirming && !success && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                disabled={pending}
                onClick={handlePrestige}
                className="flex-1 rounded-pill bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 font-display text-[13px] font-bold text-white shadow-btn disabled:opacity-50"
              >
                {pending ? 'Ascension…' : `OK, reset mes ${nextCost} coins`}
              </button>
              <button
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="rounded-pill border border-sky-border bg-white px-4 py-2 font-body text-[13px] font-medium text-text-secondary dark:border-night-border dark:bg-night-surface dark:text-text-dark-secondary"
              >
                Annuler
              </button>
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-input border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="inline-flex items-center gap-2 font-display text-[14px] font-bold text-emerald-700 dark:text-emerald-300">
                <PartyPopper className="h-4 w-4" /> Prestige {success} atteint !
              </p>
              <p className="font-body text-[12px] text-emerald-700/80 dark:text-emerald-300/70">
                Nouveau bonus : +{success * 5} % de gains. Titre <em>Renaissance {success}</em> débloqué.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 font-body text-[12px] text-error">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
