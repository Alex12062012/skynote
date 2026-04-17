'use client'

import { cn } from '@/lib/utils'

/**
 * PrestigeCrest — chevron / étoile qui se pose AU-DESSUS du badge joueur.
 * Plus le niveau est haut, plus c'est visuel :
 *   P1-2  → chevron bronze
 *   P3-5  → chevron argent
 *   P6-9  → chevron or
 *   P10+  → couronne diamant animée
 */

interface PrestigeCrestProps {
  level: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_PX: Record<NonNullable<PrestigeCrestProps['size']>, number> = {
  sm: 18, md: 24, lg: 34,
}

function tierOf(level: number): 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' {
  if (level <= 0) return 'none'
  if (level <= 2) return 'bronze'
  if (level <= 5) return 'silver'
  if (level <= 9) return 'gold'
  return 'diamond'
}

const TIER_COLORS = {
  bronze:  { grad: ['#D97706', '#FCD34D'], glow: '#D9770660', stroke: '#78350F' },
  silver:  { grad: ['#94A3B8', '#F1F5F9'], glow: '#94A3B860', stroke: '#475569' },
  gold:    { grad: ['#F59E0B', '#FEF3C7'], glow: '#F59E0B88', stroke: '#92400E' },
  diamond: { grad: ['#06B6D4', '#A5F3FC'], glow: '#06B6D4AA', stroke: '#0E7490' },
} as const

export function PrestigeCrest({ level, size = 'md', className }: PrestigeCrestProps) {
  if (level <= 0) return null
  const tier = tierOf(level) as Exclude<ReturnType<typeof tierOf>, 'none'>
  const c = TIER_COLORS[tier]
  const px = SIZE_PX[size]

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none',
        tier === 'diamond' && 'animate-bounce-soft',
        className,
      )}
      title={`Prestige ${level}`}
      style={{ width: px * 1.6, height: px }}
    >
      {/* glow */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full blur-md opacity-70"
        style={{ background: c.glow }}
      />

      {/* SVG chevron */}
      <svg width={px * 1.5} height={px} viewBox="0 0 60 40" className="relative drop-shadow">
        <defs>
          <linearGradient id={`grad-${tier}-${level}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.grad[1]} />
            <stop offset="1" stopColor={c.grad[0]} />
          </linearGradient>
        </defs>
        <path
          d="M6 30 L30 8 L54 30 L46 30 L30 16 L14 30 Z"
          fill={`url(#grad-${tier}-${level})`}
          stroke={c.stroke}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {level >= 3 && (
          <path
            d="M14 36 L30 20 L46 36 L40 36 L30 26 L20 36 Z"
            fill={`url(#grad-${tier}-${level})`}
            stroke={c.stroke}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* badge numéro */}
      <span
        className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-white px-1 font-display text-[10px] font-black tabular-nums shadow"
        style={{ color: c.stroke }}
      >
        {level}
      </span>
    </div>
  )
}
