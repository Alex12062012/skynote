'use client'

import { useEffect, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { SkyCoin } from './SkyCoin'

interface CoinParticle {
  id: number
  x: number
  delay: number
  duration: number
  size: number
}

interface CoinAnimationProps {
  trigger: boolean
  count?: number
  onDone?: () => void
}

export function CoinAnimation({ trigger, count = 10, onDone }: CoinAnimationProps) {
  const [particles, setParticles] = useState<CoinParticle[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!trigger) return
    const newParticles: CoinParticle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 5 + (i / count) * 90 + (Math.random() - 0.5) * 10,
      delay: Math.random() * 0.4,
      duration: 0.7 + Math.random() * 0.5,
      size: 16 + Math.floor(Math.random() * 12),
    }))
    setParticles(newParticles)
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setParticles([])
      onDone?.()
    }, 1800)
    return () => clearTimeout(timer)
  }, [trigger, count, onDone])

  if (!visible || particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '20%',
            animation: `float-up ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        >
          <SkyCoin size={p.size} />
        </div>
      ))}
    </div>
  )
}

// ─── Toast compact de coins gagnés ──────────────────────────

interface CoinToastProps {
  amount: number
  visible: boolean
  onHide: () => void
}

export function CoinToast({ amount, visible, onHide }: CoinToastProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onHide, 3000)
    return () => clearTimeout(t)
  }, [visible, onHide])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-in">
      <div className="flex items-center gap-3 rounded-pill border border-brand/20 bg-sky-surface px-5 py-3 shadow-coin dark:border-brand-dark/20 dark:bg-night-surface dark:shadow-coin-dark">
        <SkyCoin size={28} className="animate-coin-pulse" />
        <div>
          <p className="font-display text-[15px] font-bold text-brand dark:text-brand-dark">
            +{amount} Sky Coins !
          </p>
          <p className="inline-flex items-center gap-1 font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
            Score parfait <PartyPopper className="h-3.5 w-3.5" />
          </p>
        </div>
      </div>
    </div>
  )
}
