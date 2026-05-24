'use client'

/**
 * CoinReward — animation "juicy mobile game" style Brawl Stars / Supercell.
 *
 * Architecture :
 *   1. Spawn  : les pièces pop avec scale 0.8→1.2→1.0 + glow flash (250ms)
 *   2. Arc    : chaque pièce suit une courbe en cloche vers le compteur (650ms)
 *   3. Arrivée: compteur bounce + count-up progressif + tick son
 *
 * Anti-double-play :
 *   - onDone est stable (useCallback dans le parent CoinRewardProvider)
 *   - Le useEffect dépend uniquement de [visible, amount, onDone]
 *   - Les valeurs aléatoires sont calculées une seule fois (useRef stable)
 */

import { useEffect, useState, useRef, type ReactNode } from 'react'
import { Trophy } from 'lucide-react'
import { SkyCoin } from './SkyCoin'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle {
  id: number
  /** Position absolue (fixed) de l'élément */
  posX: number
  posY: number
  /** Décalage du point de contrôle d'arc par rapport à la position */
  cpOffX: number
  cpOffY: number
  /** Décalage cible (transform translate) par rapport à posX/posY */
  tOffX: number
  tOffY: number
  rotation: number
  size: number
  delay: number
}

// ─── Sound ────────────────────────────────────────────────────────────────────
function playRewardChord() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    // Accord do majeur arpégé — snappy, satisfaisant
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.065
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.14, t + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.start(t)
      osc.stop(t + 0.25)
    })
  } catch {}
}

function playCoinTick() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(2100, ctx.currentTime + 0.045)
    gain.gain.setValueAtTime(0.07, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.09)
  } catch {}
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CoinRewardProps {
  visible: boolean
  amount: number
  reason: string
  icon?: ReactNode
  variant?: 'normal' | 'prestige'
  onDone?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CoinReward({
  visible,
  amount,
  reason,
  icon,
  variant = 'normal',
  onDone,
}: CoinRewardProps) {
  const isPrestige = variant === 'prestige'
  // Icône par défaut selon le variant
  const defaultIcon = isPrestige
    ? <span style={{ fontSize: 26, lineHeight: 1 }}>🏆</span>
    : <Trophy className="h-7 w-7 text-amber-500" />
  const resolvedIcon = icon ?? defaultIcon
  const [active, setActive]               = useState(false)
  const [flyPhase, setFlyPhase]           = useState(false)
  const [displayedCoins, setDisplayedCoins] = useState(0)
  const [counterPop, setCounterPop]       = useState(false)
  const [toastVisible, setToastVisible]   = useState(false)
  const [toastExiting, setToastExiting]   = useState(false)
  const [particles, setParticles]         = useState<Particle[]>([])
  const [sparkles, setSparkles]           = useState<{ id: number; angle: number; dist: number; color: string }[]>([])

  const countRef      = useRef(0)
  const soundCooldown = useRef(false)
  const timers        = useRef<ReturnType<typeof setTimeout>[]>([])

  // Nettoyer tous les timers en cours
  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function addTimer(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }

  useEffect(() => {
    if (!visible) {
      clearTimers()
      setActive(false)
      setFlyPhase(false)
      setToastVisible(false)
      setToastExiting(false)
      setDisplayedCoins(0)
      setParticles([])
      setSparkles([])
      countRef.current = 0
      return
    }

    // ── Mesure DOM ──────────────────────────────────────────────────
    const counterEl = document.querySelector('[data-coin-counter]')
    const rect = counterEl?.getBoundingClientRect()
    const tx = rect ? rect.left + rect.width / 2 : window.innerWidth - 90
    const ty = rect ? rect.top + rect.height / 2 : 28

    const cx = window.innerWidth / 2
    const cy = Math.min(window.innerHeight * 0.42, window.innerHeight - 200)

    // ── Particules stables (calculées une seule fois) ────────────────
    // Pas de Math.random() dans le render — tout dans useEffect
    const coinCount = Math.min(amount, 8)
    const newParticles: Particle[] = Array.from({ length: coinCount }, (_, i) => {
      // Disposition en cercle irrégulier autour du centre
      const baseAngle = (i / coinCount) * Math.PI * 2
      const jitter = (((i * 17 + 31) % 7) / 7 - 0.5) * 0.5
      const angle = baseAngle + jitter
      const r = 30 + ((i * 13 + 7) % 5) * 8  // 30..62 px

      const spawnX = cx + Math.cos(angle) * r
      const spawnY = cy + Math.sin(angle) * r * 0.7

      // Décalage cible (en transform, relatif à posX/posY)
      const tOffX = tx - spawnX
      const tOffY = ty - spawnY

      // Point de contrôle arc : milieu du trajet + déviation latérale + montée
      const midX = tOffX / 2
      const midY = tOffY / 2
      const lateralSign = i % 2 === 0 ? 1 : -1
      const cpOffX = midX + lateralSign * (25 + ((i * 11) % 4) * 15)
      const cpOffY = midY - (55 + ((i * 7) % 5) * 20) // toujours vers le haut

      return {
        id: i,
        posX: spawnX,
        posY: spawnY,
        cpOffX,
        cpOffY,
        tOffX,
        tOffY,
        rotation: (((i * 23 + 11) % 12) - 6) * 8, // -48..+48 deg
        size: 20 + ((i * 7) % 5) * 2,              // 20..28 px
        delay: i * 55,
      }
    })

    // Sparkles au point de spawn — or pur en mode prestige
    const sparkleColors = isPrestige
      ? ['#FCD34D', '#F59E0B', '#FBBF24', '#FDE68A', '#F97316']  // tout ambre/or
      : ['#FCD34D', '#60A5FA', '#A78BFA', '#34D399', '#FB923C']   // multicolore normal
    const newSparkles = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      angle: (i / 10) * 360,
      dist: 38 + ((i * 11) % 4) * 12,
      color: sparkleColors[i % sparkleColors.length],
    }))


    // Sequence animee : spawn -> arc -> count-up -> sortie
    setParticles(newParticles)
    setSparkles(newSparkles)

    addTimer(() => {
      setActive(true)
      setToastVisible(true)
      if (isPrestige) playPrestigeChord()
      else playRewardChord()
    }, 50)

    // Vol en arc vers le compteur
    addTimer(() => { setFlyPhase(true) }, 350)

    // Count-up progressif (une pice a la fois)
    const lastCoinArrival = 350 + 700 + (coinCount - 1) * 55
    for (let i = 0; i < amount; i++) {
      const tickDelay = lastCoinArrival + i * 70
      addTimer(() => {
        setDisplayedCoins((prev) => prev + 1)
        setCounterPop(true)
        playCoinTick()
        addTimer(() => setCounterPop(false), 180)
      }, tickDelay)
    }

    // Sortie toast
    const totalDuration = lastCoinArrival + amount * 70 + 500
    addTimer(() => { setToastExiting(true) }, totalDuration)
    addTimer(() => {
      setToastVisible(false)
      setActive(false)
      setFlyPhase(false)
      setDisplayedCoins(0)
      setParticles([])
      setSparkles([])
      countRef.current = 0
      onDone?.()
    }, totalDuration + 340)

    return () => { clearTimers() }
  }, [visible, amount, onDone])

  function playRewardChord() {
    if (soundCooldown.current) return
    soundCooldown.current = true
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.13, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.3)
        }, i * 65)
      })
      setTimeout(() => { soundCooldown.current = false }, 600)
    } catch (_e) { soundCooldown.current = false }
  }

  /** Son prestige : arpège plus haut et cristallin, type "récompense rare" */
  function playPrestigeChord() {
    if (soundCooldown.current) return
    soundCooldown.current = true
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      // Mi majeur aigu + shimmer
      const notes = [659, 830, 988, 1319, 1661]
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = i < 3 ? 'sine' : 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.10, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.38)
        }, i * 55)
      })
      setTimeout(() => { soundCooldown.current = false }, 700)
    } catch (_e) { soundCooldown.current = false }
  }

  function playCoinTick() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(2100, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.07, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch (_e) {}
  }

  if (!toastVisible && !active) return null

  const CSS = `
    @keyframes sk-coin-spawn {
      0%   { transform: scale(0.8); opacity: 0; filter: brightness(1); }
      45%  { transform: scale(1.22); opacity: 1; filter: brightness(1.6); }
      100% { transform: scale(1.0); opacity: 1; filter: brightness(1); }
    }
    @keyframes sk-coin-fly {
      0%   { opacity: 1; transform: scale(1.0) rotate(var(--rot)); }
      38%  { opacity: 1; transform: translate(var(--cp-x), var(--cp-y)) scale(0.95) rotate(calc(var(--rot) * 0.4)); }
      78%  { opacity: 0.85; transform: translate(var(--t-x), var(--t-y)) scale(0.45); }
      100% { opacity: 0; transform: translate(var(--t-x), var(--t-y)) scale(0.05) rotate(0deg); }
    }
    @keyframes sk-sparkle {
      0%   { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--ex), var(--ey)) scale(0); opacity: 0; }
    }
    @keyframes sk-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.9); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
    @keyframes sk-toast-out {
      from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      to   { opacity: 0; transform: translateX(-50%) translateY(-14px) scale(0.9); }
    }
    @keyframes sk-counter-pop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.35); }
      70%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
  `

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      <style>{CSS}</style>

      {/* Coins en vol */}
      {active && particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: p.posX,
            top: p.posY,
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            animation: flyPhase
              ? `sk-coin-fly 0.68s cubic-bezier(0.4,0,0.2,1) ${p.delay}ms forwards`
              : `sk-coin-spawn 0.26s cubic-bezier(0.34,1.56,0.64,1) ${p.delay}ms both`,
            ['--rot' as string]: `${p.rotation}deg`,
            ['--cp-x' as string]: `${p.cpOffX}px`,
            ['--cp-y' as string]: `${p.cpOffY}px`,
            ['--t-x' as string]: `${p.tOffX}px`,
            ['--t-y' as string]: `${p.tOffY}px`,
            // Coins dorés en mode prestige
            filter: isPrestige ? 'sepia(0.6) saturate(2.5) hue-rotate(-10deg) brightness(1.25)' : undefined,
          }}
        >
          <SkyCoin size={p.size} />
        </div>
      ))}

      {/* Sparkles au spawn */}
      {active && !flyPhase && sparkles.map((sp) => {
        const rad = sp.angle * Math.PI / 180
        return (
          <div
            key={sp.id}
            style={{
              position: 'fixed',
              left: window.innerWidth / 2,
              top: Math.min(window.innerHeight * 0.42, window.innerHeight - 200),
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: sp.color,
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              animation: `sk-sparkle 0.44s ease-out forwards`,
              ['--ex' as string]: `${Math.cos(rad) * sp.dist}px`,
              ['--ey' as string]: `${Math.sin(rad) * sp.dist}px`,
            }}
          />
        )
      })}

      {/* Toast */}
      {toastVisible && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: isPrestige ? 'rgba(28,18,6,0.95)' : 'rgba(15,23,42,0.93)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: isPrestige ? '1.5px solid rgba(251,191,36,0.75)' : '1px solid rgba(251,191,36,0.28)',
            borderRadius: 999,
            padding: '10px 22px',
            boxShadow: isPrestige
              ? '0 0 24px rgba(251,191,36,0.35), 0 8px 32px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(0,0,0,0.4)',
            animation: toastExiting
              ? 'sk-toast-out 0.3s ease-in forwards'
              : 'sk-toast-in 0.3s cubic-bezier(0.34,1.3,0.64,1) forwards',
          }}
        >
          {resolvedIcon}
          <span style={{ color: isPrestige ? '#FDE68A' : '#F0F6FF', fontWeight: 700, fontSize: 15 }}>{reason}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              color: '#FCD34D',
              fontWeight: 800,
              fontSize: 18,
              display: 'inline-block',
              animation: counterPop ? 'sk-counter-pop 0.18s ease-out forwards' : 'none',
            }}>
              +{displayedCoins}
            </span>
            <div style={isPrestige ? { filter: 'sepia(0.5) saturate(2) brightness(1.3)' } : undefined}>
              <SkyCoin size={18} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
