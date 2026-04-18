'use client'

import { useRef, useState, useCallback } from 'react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { cn } from '@/lib/utils'
import { useCoinReward } from '@/components/providers/CoinRewardProvider'

// ─── Segments VISIBLES (le segment secret n'est pas affiché) ─────────────────
export const WHEEL_SEGMENTS = [
  { id: 'lost',       label: 'Perdu',        type: 'lost',     value: 0,   color: '#EF4444', text: '#fff',    probability: 20 },
  { id: 'coins_20',   label: '+20',          type: 'coins',    value: 20,  color: '#FB923C', text: '#fff',    probability: 16 },
  { id: 'coins_40',   label: '+40',          type: 'coins',    value: 40,  color: '#FBBF24', text: '#fff',    probability: 13 },
  { id: 'coins_60',   label: '+60',          type: 'coins',    value: 60,  color: '#A3E635', text: '#1a2e05', probability: 18 },
  { id: 'coins_100',  label: '+100',         type: 'coins',    value: 100, color: '#34D399', text: '#022c22', probability: 13 },
  { id: 'coins_200',  label: '+200',         type: 'coins',    value: 200, color: '#2DD4BF', text: '#042f2e', probability: 7  },
  { id: 'boost_xp',  label: 'Boost XP ×2', type: 'boost_xp', value: 0,   color: '#A78BFA', text: '#fff',    probability: 4  },
  { id: 'skin',       label: 'Skin',         type: 'skin',     value: 0,   color: '#F472B6', text: '#fff',    probability: 5  },
] as const

const NUM_SEGMENTS = WHEEL_SEGMENTS.length
const SEG_ANGLE = 360 / NUM_SEGMENTS
const SPIN_COST = 50

// ─── SVG helpers ──────────────────────────────────────────────────────────────
function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function segPath(cx: number, cy: number, r: number, i: number) {
  const start = polarToXY(cx, cy, r, i * SEG_ANGLE)
  const end   = polarToXY(cx, cy, r, (i + 1) * SEG_ANGLE)
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y} Z`
}

function labelPos(cx: number, cy: number, r: number, i: number) {
  return polarToXY(cx, cy, r, i * SEG_ANGLE + SEG_ANGLE / 2)
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface SpinResult {
  segmentIndex: number
  segment: typeof WHEEL_SEGMENTS[number]
  netGain: number
  newBalance: number
}

interface SpinWheelProps {
  coins: number
  onBalanceUpdate?: (newBalance: number) => void
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function SpinWheel({ coins, onBalanceUpdate }: SpinWheelProps) {
  const [rotation, setRotation]     = useState(0)
  const [spinning, setSpinning]     = useState(false)
  const [result, setResult]         = useState<SpinResult | null>(null)
  const [balance, setBalance]       = useState(coins)
  const [showResult, setShowResult] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const currentRotation             = useRef(0)
  const { showReward } = useCoinReward()

  const cx = 150, cy = 150, r = 140

  const spin = useCallback(async () => {
    if (spinning || balance < SPIN_COST) return
    setError(null)
    setShowResult(false)
    setSpinning(true)

    let res: SpinResult
    try {
      const resp = await fetch('/api/boutique/spin', { method: 'POST' })
      if (!resp.ok) {
        const body = await resp.json()
        setError(body.error ?? 'Erreur serveur')
        setSpinning(false)
        return
      }
      res = await resp.json()
    } catch {
      setError('Erreur réseau')
      setSpinning(false)
      return
    }

    // Calculer l'angle final pour atterrir sur le bon segment
    const targetStop = ((360 - res.segmentIndex * SEG_ANGLE - SEG_ANGLE / 2) + 360) % 360
    const currentMod = currentRotation.current % 360
    const delta      = (targetStop - currentMod + 360) % 360
    const numSpins   = 6 + Math.floor(Math.random() * 3) // 6-8 tours
    const newRot     = currentRotation.current + numSpins * 360 + delta

    currentRotation.current = newRot
    setRotation(newRot)

    // Attendre la fin de l'animation (4s)
    setTimeout(() => {
      setResult(res)
      setBalance(res.newBalance)
      onBalanceUpdate?.(res.newBalance)
      setShowResult(true)
      setSpinning(false)
      if (res.netGain > 0) {
        showReward({ amount: res.netGain, reason: 'Roue de la fortune !' })
      }
    }, 4200)
  }, [spinning, balance, onBalanceUpdate])

  const canSpin = balance >= SPIN_COST && !spinning

  return (
    <div className="flex flex-col items-center gap-6">

      {/* Solde actuel */}
      <div className="flex items-center gap-2 rounded-pill border border-sky-border bg-sky-surface px-4 py-2 dark:border-night-border dark:bg-night-surface">
        <SkyCoin size={20} />
        <span className="font-display text-[15px] font-bold tabular-nums text-text-main dark:text-text-dark-main">
          {balance.toLocaleString('fr-FR')}
        </span>
        <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          Sky Coins
        </span>
      </div>

      {/* Roue + flèche */}
      <div className="relative select-none">
        {/* Flèche indicatrice */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
          <div
            className="h-0 w-0"
            style={{
              borderLeft:  '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop:   '24px solid #2563EB',
              filter: 'drop-shadow(0 2px 4px rgba(37,99,235,0.4))',
            }}
          />
        </div>

        {/* Cercle extérieur (glow) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #EF4444, #FB923C, #FBBF24, #A3E635, #34D399, #2DD4BF, #A78BFA, #F472B6, #EF4444)',
            padding: 4,
            borderRadius: '50%',
            boxShadow: spinning
              ? '0 0 40px rgba(37,99,235,0.6), 0 0 80px rgba(37,99,235,0.2)'
              : '0 0 20px rgba(37,99,235,0.25)',
            transition: 'box-shadow 0.5s ease',
          }}
        />

        {/* SVG de la roue */}
        <div
          style={{
            width: 300,
            height: 300,
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)'
              : 'none',
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <svg
            width={300}
            height={300}
            viewBox="0 0 300 300"
          >
            {WHEEL_SEGMENTS.map((seg, i) => {
              const lp = labelPos(cx, cy, r * 0.68, i)
              const labelAngle = i * SEG_ANGLE + SEG_ANGLE / 2
              return (
                <g key={seg.id}>
                  <path
                    d={segPath(cx, cy, r, i)}
                    fill={seg.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <g transform={`translate(${lp.x}, ${lp.y}) rotate(${labelAngle})`}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fontWeight="bold"
                      fill={seg.text}
                      fontFamily="sans-serif"
                    >
                      {seg.label}
                    </text>
                  </g>
                </g>
              )
            })}
            {/* Centre */}
            <circle
              cx={cx} cy={cy} r={28}
              fill="white"
              stroke="#E2EEFF"
              strokeWidth={3}
              style={{ filter: 'drop-shadow(0 2px 6px rgba(37,99,235,0.15))' }}
            />
            {/* Étoile SVG au centre */}
            <path
              d="M150 130 l4.5 9 10 1.5 -7 7 1.5 10 -9 -4.5 -9 4.5 1.5 -10 -7 -7 10 -1.5z"
              fill="#2563EB"
              opacity={0.85}
            />
          </svg>
        </div>
      </div>

      {/* Bouton tourner */}
      <button
        onClick={spin}
        disabled={!canSpin}
        className={cn(
          'flex items-center gap-2 rounded-pill px-8 py-3 font-display text-[16px] font-bold transition-all duration-200',
          canSpin
            ? 'bg-brand text-white shadow-btn hover:bg-brand-hover active:scale-95'
            : 'cursor-not-allowed bg-sky-cloud text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary'
        )}
      >
        {spinning ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            La roue tourne…
          </>
        ) : (
          <>
            <SkyCoin size={18} />
            Tourner — {SPIN_COST} coins
          </>
        )}
      </button>

      {/* Erreur */}
      {error && (
        <p className="rounded-card border border-error/20 bg-red-50 px-4 py-2 font-body text-[13px] text-error dark:bg-red-950/20">
          {error}
        </p>
      )}

      {/* Résultat */}
      {showResult && result && (
        <ResultBanner result={result} onClose={() => setShowResult(false)} />
      )}
    </div>
  )
}

// ─── Bannière résultat ────────────────────────────────────────────────────────
function ResultBanner({ result, onClose }: { result: SpinResult; onClose: () => void }) {
  const seg = result.segment
  const isLoss    = seg.type === 'lost' || result.netGain < 0
  const isWin     = result.netGain > 0
  const isSpecial = seg.type === 'boost_xp' || seg.type === 'skin' || seg.type === 'frame'

  return (
    <div
      className="animate-pop-in flex w-full max-w-sm flex-col items-center gap-2 rounded-card border p-5 text-center shadow-card"
      style={{
        borderColor: isSpecial ? '#A78BFA44' : isWin ? '#34D39944' : isLoss ? '#EF444444' : '#E2EEFF',
        background: isSpecial ? '#F5F3FF' : isWin ? '#F0FDF4' : isLoss ? '#FFF1F2' : '#F8FAFF',
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: seg.color + '22', border: `2px solid ${seg.color}` }}
      >
        <div className="h-3 w-3 rounded-full" style={{ background: seg.color }} />
      </div>
      <p
        className="font-display text-[20px] font-bold"
        style={{ color: isSpecial ? '#7C3AED' : isWin ? '#059669' : isLoss ? '#DC2626' : '#2563EB' }}
      >
        {seg.type === 'lost'
          ? 'Pas de chance…'
          : seg.type === 'coins'
          ? result.netGain > 0
            ? `+${result.netGain} coins nets`
            : `${result.netGain} coins nets`
          : seg.type === 'boost_xp'
          ? 'Boost XP ×2 activé !'
          : 'Skin débloqué !'}
      </p>
      <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
        {seg.type === 'coins' && `Tu as reçu ${(seg as any).value} coins pour un coût de ${SPIN_COST} coins.`}
        {seg.type === 'lost' && 'Retente ta chance !'}
        {seg.type === 'boost_xp' && 'Tes XP sont doublés pendant 1 heure.'}
        {(seg.type === 'skin' || seg.type === 'frame') && 'Un skin a été ajouté à ta collection dans la boutique.'}
      </p>
      <button
        onClick={onClose}
        className="mt-1 rounded-pill bg-sky-cloud px-4 py-1.5 font-body text-[13px] font-medium text-brand transition hover:bg-sky-border dark:bg-night-border dark:text-brand-dark dark:hover:bg-night-border-strong"
      >
        OK
      </button>
    </div>
  )
}
