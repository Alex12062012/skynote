'use client'

import { useEffect, useState, useRef } from 'react'
import { SkyCoin } from './SkyCoin'

interface CoinParticle {
  id: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  delay: number
  size: number
}

interface CoinRewardProps {
  visible: boolean
  amount: number
  reason: string
  icon?: string
  onDone?: () => void
}

// Son satisfaisant — accord montant
function playRewardSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.1 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25)
      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.3)
    })
  } catch {}
}

function playCoinTick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  } catch {}
}

export function CoinReward({ visible, amount, reason, icon = '🏆', onDone }: CoinRewardProps) {
  const [particles, setParticles] = useState<CoinParticle[]>([])
  const [showToast, setShowToast] = useState(false)
  const [displayedCoins, setDisplayedCoins] = useState(0)
  const countRef = useRef(0)
  const tickCooldown = useRef(false)

  useEffect(() => {
    if (!visible) {
      setParticles([])
      setShowToast(false)
      setDisplayedCoins(0)
      return
    }

    // Trouver le compteur dans la navbar
    const counter = document.querySelector('[data-coin-counter]')
    const counterRect = counter?.getBoundingClientRect()
    const targetX = counterRect ? counterRect.left + counterRect.width / 2 : window.innerWidth - 100
    const targetY = counterRect ? counterRect.top + counterRect.height / 2 : 32

    // Point de départ = centre de l'écran
    const startX = window.innerWidth / 2
    const startY = window.innerHeight / 2

    // Jouer le son de récompense
    playRewardSound()

    // Afficher le toast
    setShowToast(true)

    // Créer les particules après 0.5s
    setTimeout(() => {
      const count = Math.min(amount, 10)
      const newParticles: CoinParticle[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: startX + (Math.random() - 0.5) * 80,
        y: startY + (Math.random() - 0.5) * 80,
        offsetX: targetX,
        offsetY: targetY,
        delay: i * 100,
        size: 20 + Math.floor(Math.random() * 14),
      }))
      setParticles(newParticles)

      // Incrémenter le compteur au fur et à mesure
      countRef.current = 0
      const interval = setInterval(() => {
        countRef.current += 1
        setDisplayedCoins(countRef.current)

        if (!tickCooldown.current) {
          tickCooldown.current = true
          playCoinTick()
          setTimeout(() => { tickCooldown.current = false }, 90)
        }

        if (countRef.current >= amount) {
          clearInterval(interval)
          setTimeout(() => {
            setParticles([])
            setShowToast(false)
            setDisplayedCoins(0)
            onDone?.()
          }, 1500)
        }
      }, Math.max(60, 900 / amount))

    }, 500)

  }, [visible, amount, onDone])

  if (!visible && particles.length === 0 && !showToast) return null

  return (
    <>
      <style>{`
        @keyframes coin-fly {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          30%  { opacity: 1; transform: translate(
            calc((var(--tx) - var(--sx)) * 0.15 + var(--rx)),
            calc((var(--ty) - var(--sy)) * 0.15 + var(--ry))
          ) scale(1.3); }
          100% { transform: translate(
            calc(var(--tx) - var(--sx)),
            calc(var(--ty) - var(--sy))
          ) scale(0.3); opacity: 0; }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          to   { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.95); }
        }
      `}</style>

      {/* Pièces volantes */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none fixed z-[999]"
          style={{
            left: p.x,
            top: p.y,
            '--sx': `${p.x}px`,
            '--sy': `${p.y}px`,
            '--tx': `${p.offsetX}px`,
            '--ty': `${p.offsetY}px`,
            '--rx': `${(Math.random() - 0.5) * 60}px`,
            '--ry': `${(Math.random() - 0.5) * 60}px`,
            animation: `coin-fly 0.9s cubic-bezier(0.4,0,0.2,1) ${p.delay}ms forwards`,
          } as React.CSSProperties}
        >
          <SkyCoin size={p.size} />
        </div>
      ))}

      {/* Toast en bas au milieu */}
      {showToast && (
        <div
          className="pointer-events-none fixed bottom-8 left-1/2 z-[998]"
          style={{
            animation: displayedCoins >= amount
              ? 'toast-out 0.4s ease-out forwards'
              : 'toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-brand/20 bg-sky-surface px-6 py-4 shadow-2xl dark:border-brand-dark/20 dark:bg-night-surface">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="font-body text-[12px] font-semibold uppercase tracking-wider text-brand dark:text-brand-dark">
                {reason}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <SkyCoin size={20} />
                <span className="font-display text-[22px] font-bold text-text-main dark:text-text-dark-main tabular-nums">
                  +{displayedCoins}
                </span>
                <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                  / {amount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
