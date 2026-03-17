'use client'

import { useEffect, useState, useRef } from 'react'
import { SkyCoin } from './SkyCoin'

interface CoinParticle {
  id: number
  startX: number
  startY: number
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

// Son satisfaisant via Web Audio API
function playRewardSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Accord de 3 notes montantes (do-mi-sol)
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.35)
    })
  } catch {}
}

function playCoinSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch {}
}

export function CoinReward({ visible, amount, reason, icon = '🏆', onDone }: CoinRewardProps) {
  const [phase, setPhase] = useState<'hidden' | 'show' | 'fly' | 'count' | 'done'>('hidden')
  const [particles, setParticles] = useState<CoinParticle[]>([])
  const [displayedCoins, setDisplayedCoins] = useState(0)
  const [counterPos, setCounterPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const countRef = useRef(0)
  const coinSoundCooldown = useRef(false)

  useEffect(() => {
    if (!visible) { setPhase('hidden'); setDisplayedCoins(0); return }

    // Trouver la position du compteur de coins dans la navbar
    const findCounter = () => {
      const counter = document.querySelector('[data-coin-counter]')
      if (counter) {
        const rect = counter.getBoundingClientRect()
        setCounterPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      } else {
        setCounterPos({ x: window.innerWidth - 100, y: 32 })
      }
    }
    findCounter()

    setPhase('show')
    playRewardSound()

    // Après 1.5s → lancer les particules
    const t1 = setTimeout(() => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const count = Math.min(amount, 12)

      const newParticles: CoinParticle[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        startX: cx,
        startY: cy,
        offsetX: (Math.random() - 0.5) * 120,
        offsetY: (Math.random() - 0.5) * 120,
        delay: i * 80,
        size: 24 + Math.floor(Math.random() * 16),
      }))
      setParticles(newParticles)
      setPhase('fly')
    }, 1500)

    return () => clearTimeout(t1)
  }, [visible, amount])

  // Incrémenter le compteur au fur et à mesure que les pièces arrivent
  useEffect(() => {
    if (phase !== 'fly') return

    countRef.current = 0
    setDisplayedCoins(0)

    const interval = setInterval(() => {
      countRef.current += 1
      setDisplayedCoins(countRef.current)

      // Son par pièce
      if (!coinSoundCooldown.current) {
        coinSoundCooldown.current = true
        playCoinSound()
        setTimeout(() => { coinSoundCooldown.current = false }, 80)
      }

      if (countRef.current >= amount) {
        clearInterval(interval)
        setPhase('count')
        setTimeout(() => {
          setPhase('done')
          onDone?.()
        }, 1500)
      }
    }, Math.max(30, 800 / amount))

    return () => clearInterval(interval)
  }, [phase, amount, onDone])

  if (phase === 'hidden') return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'var(--reward-bg, rgba(255,255,255,0.96))',
        backdropFilter: 'blur(8px)',
        animation: phase === 'done' ? 'reward-fade-out 0.4s ease-out forwards' : 'reward-fade-in 0.3s ease-out forwards',
      }}
      onClick={() => { if (phase === 'count' || phase === 'done') onDone?.() }}
    >
      <style>{`
        @keyframes reward-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes reward-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes particle-burst {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          40%  { transform: translate(var(--ox), var(--oy)) scale(1.2); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
        }
        @keyframes reward-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes coin-count-pop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .dark-reward { background: rgba(6, 13, 26, 0.97) !important; }
      `}</style>

      {/* Contenu central */}
      <div className="flex flex-col items-center gap-6 text-center px-8"
        style={{ animation: 'reward-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>

        {/* Icône objectif */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft text-5xl">
          {icon}
        </div>

        {/* Raison */}
        <div>
          <p className="font-body text-[13px] font-semibold uppercase tracking-widest text-brand dark:text-brand-dark mb-2">
            Récompense
          </p>
          <h2 className="font-display text-[26px] font-bold text-text-main dark:text-text-dark-main leading-tight">
            {reason}
          </h2>
        </div>

        {/* Compteur de coins animé */}
        <div className="flex items-center gap-3"
          style={{ animation: displayedCoins > 0 ? 'coin-count-pop 0.1s ease-out' : 'none' }}>
          <SkyCoin size={48} />
          <span className="font-display text-[52px] font-bold text-brand dark:text-brand-dark tabular-nums leading-none">
            +{displayedCoins}
          </span>
        </div>

        {/* Message félicitations */}
        {(phase === 'count' || phase === 'done') && (
          <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary animate-fade-in">
            Félicitations ! 🎉 Appuie n'importe où pour continuer.
          </p>
        )}
      </div>

      {/* Particules volantes */}
      {particles.map((p) => {
        const tx = counterPos.x - p.startX
        const ty = counterPos.y - p.startY
        return (
          <div
            key={p.id}
            className="pointer-events-none fixed"
            style={{
              left: p.startX,
              top: p.startY,
              '--ox': `${p.offsetX}px`,
              '--oy': `${p.offsetY}px`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              animation: `particle-burst 1.2s cubic-bezier(0.4,0,0.2,1) ${p.delay}ms forwards`,
            } as React.CSSProperties}
          >
            <SkyCoin size={p.size} />
          </div>
        )
      })}
    </div>
  )
}
