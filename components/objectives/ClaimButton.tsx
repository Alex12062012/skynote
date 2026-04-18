'use client'

import { useState, useTransition, useRef } from 'react'
import { Check } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { useCoinReward } from '@/components/providers/CoinRewardProvider'
import { claimObjectiveReward } from '@/lib/supabase/claim-actions'

interface ClaimButtonProps {
  objectiveId: string
  rewardCoins: number
  objectiveTitle?: string
  objectiveIcon?: string
  onClaimed?: (coins: number) => void
}

interface FlyingCoin {
  id: number
  startX: number
  startY: number
}

export function ClaimButton({ objectiveId, rewardCoins, objectiveTitle, objectiveIcon, onClaimed }: ClaimButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { showReward } = useCoinReward()
  const [claimed, setClaimed] = useState(false)
  const [flyingCoins, setFlyingCoins] = useState<FlyingCoin[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleClaim() {
    if (isPending || claimed) return

    // Position du bouton pour départ des pièces
    const rect = btnRef.current?.getBoundingClientRect()
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

    // Créer les pièces volantes
    const coins: FlyingCoin[] = Array.from({ length: Math.min(rewardCoins, 8) }, (_, i) => ({
      id: Date.now() + i,
      startX,
      startY,
    }))
    setFlyingCoins(coins)

    // Nettoyer après animation
    setTimeout(() => setFlyingCoins([]), 1000)

    startTransition(async () => {
      const { coinsAwarded, error } = await claimObjectiveReward(objectiveId)
      if (!error && coinsAwarded > 0) {
        setClaimed(true)
        onClaimed?.(coinsAwarded)
      }
    })
  }

  if (claimed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-success-soft px-3 py-1 font-body text-[12px] font-semibold text-success dark:bg-emerald-950/30 dark:text-success-dark">
        <Check className="h-3.5 w-3.5 text-green-600" /> Réclamé
      </span>
    )
  }

  return (
    <>
      {/* Pièces volantes vers la navbar */}
      {flyingCoins.map((coin) => (
        <FlyingCoinParticle key={coin.id} startX={coin.startX} startY={coin.startY} />
      ))}

      <button
        ref={btnRef}
        onClick={handleClaim}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-pill border border-brand/30 bg-brand-soft px-3 py-1.5 font-body text-[12px] font-semibold text-brand transition-all hover:bg-brand hover:text-white disabled:opacity-60 dark:border-brand-dark/30 dark:bg-brand-dark-soft dark:text-brand-dark dark:hover:bg-brand-dark dark:hover:text-night-bg"
      >
        <SkyCoin size={14} />
        {isPending ? 'En cours...' : `Récupérer +${rewardCoins}`}
      </button>
    </>
  )
}

// Pièce individuelle qui vole vers le haut (vers la navbar)
function FlyingCoinParticle({ startX, startY }: { startX: number; startY: number }) {
  const targetX = window.innerWidth - 120 // position approximative du compteur navbar
  const targetY = 32 // hauteur navbar
  const dx = targetX - startX
  const dy = targetY - startY
  // Offset aléatoire pour que les pièces ne partent pas toutes au même endroit
  const offsetX = (Math.random() - 0.5) * 40
  const offsetY = (Math.random() - 0.5) * 20
  const delay = Math.random() * 0.2

  return (
    <div
      className="pointer-events-none fixed z-[100]"
      style={{
        left: startX + offsetX,
        top: startY + offsetY,
        animation: `fly-to-counter 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}s forwards`,
        '--tx': `${dx - offsetX}px`,
        '--ty': `${dy - offsetY}px`,
      } as React.CSSProperties}
    >
      <SkyCoin size={20} />
      <style>{`
        @keyframes fly-to-counter {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          60%  { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.4); }
        }
      `}</style>
    </div>
  )
}
