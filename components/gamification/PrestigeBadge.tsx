'use client'

import { Brain, Star, Rocket, Crown, Gem, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BADGES } from '@/lib/gamification/config'

const ICON_MAP = { Brain, Star, Rocket, Crown, Gem, Flame } as const

// ─── Palette par tier ────────────────────────────────────────────────────────
//  • P1         → violet néon (comme Colt)
//  • P2         → rouge néon
//  • P3 et plus → or/jaune néon
type Tier = 'purple' | 'red' | 'gold'

const TIERS: Record<Tier, { neon: string; glow: string; dark: string; base: string; text: string }> = {
  purple: { neon: '#C026D3', glow: '#E879F9', dark: '#1B0433', base: '#2D0855', text: '#F5D0FE' },
  red:    { neon: '#EF4444', glow: '#F87171', dark: '#3B0A0A', base: '#5C1111', text: '#FEE2E2' },
  gold:   { neon: '#F59E0B', glow: '#FCD34D', dark: '#3B2A05', base: '#5C3F08', text: '#FEF3C7' },
}

function tierOf(level: number): Tier {
  if (level <= 1) return 'purple'
  if (level === 2) return 'red'
  return 'gold'
}

// ─── Tailles ─────────────────────────────────────────────────────────────────
export type PrestigeBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<PrestigeBadgeSize, { wrap: string; icon: number; letter: number; num: string }> = {
  xs: { wrap: 'h-8  w-8',   icon: 14, letter: 14, num: 'text-[9px]  min-w-4 h-4  px-1'   },
  sm: { wrap: 'h-12 w-12',  icon: 20, letter: 22, num: 'text-[10px] min-w-5 h-5  px-1'   },
  md: { wrap: 'h-16 w-16',  icon: 28, letter: 32, num: 'text-[11px] min-w-6 h-6  px-1.5' },
  lg: { wrap: 'h-24 w-24',  icon: 44, letter: 50, num: 'text-[13px] min-w-7 h-7  px-2'   },
  xl: { wrap: 'h-36 w-36',  icon: 68, letter: 76, num: 'text-[16px] min-w-9 h-9  px-2.5' },
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface PrestigeBadgeProps {
  level: number              // ≥ 1, sinon ne rend rien (utiliser PlayerBadge)
  badgeId: string            // id du badge (letter, brain, star, rocket…)
  letter: string             // lettre fallback
  size?: PrestigeBadgeSize
  className?: string
  animated?: boolean         // halo pulse
}

/**
 * PrestigeBadge — Hexagon néon façon Brawl Stars (Colt Prestige).
 * L'icône du joueur (lettre, cerveau, fusée, étoile…) vit DANS l'hexagone,
 * rendue dans la couleur du tier avec un effet lumineux.
 * Un pastille ronde montre le numéro de prestige en bas.
 */
export function PrestigeBadge({
  level, badgeId, letter, size = 'md', className, animated = true,
}: PrestigeBadgeProps) {
  if (level <= 0) return null
  const tier = TIERS[tierOf(level)]
  const s = SIZES[size]

  const conf = BADGES.find(b => b.id === badgeId)
  const isLetter = !conf || conf.icon === 'letter'
  const IconComp = !isLetter ? (ICON_MAP as any)[conf!.icon] : null

  const uid = `prestige-${level}-${size}-${badgeId}` // unique filter id

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {/* Halo externe */}
      <div
        aria-hidden
        className={cn(
          'absolute -inset-3 -z-10 rounded-full blur-2xl',
          animated ? 'animate-pulse' : '',
        )}
        style={{ background: tier.glow, opacity: 0.55 }}
      />

      {/* Hexagone */}
      <div className={cn('relative', s.wrap)}>
        <svg viewBox="0 0 100 110" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0"   stopColor={tier.base} />
              <stop offset="0.55" stopColor={tier.dark} />
              <stop offset="1"   stopColor="#000000" />
            </linearGradient>
            <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={`innerGlow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hexagone principal avec gradient + neon border */}
          <path
            d="M 50,3 L 91,26 L 91,79 L 50,102 L 9,79 L 9,26 Z"
            fill={`url(#bg-${uid})`}
            stroke={tier.neon}
            strokeWidth="4"
            strokeLinejoin="round"
            filter={`url(#glow-${uid})`}
          />

          {/* Liseré intérieur fin */}
          <path
            d="M 50,10 L 85,29 L 85,76 L 50,95 L 15,76 L 15,29 Z"
            fill="none"
            stroke={tier.neon}
            strokeWidth="1"
            strokeOpacity="0.45"
            strokeLinejoin="round"
          />

          {/* Reflet haut (shine) */}
          <path
            d="M 50,10 L 85,29 L 50,35 L 15,29 Z"
            fill={tier.neon}
            fillOpacity="0.12"
          />

          {/* Lettre (fallback) rendue en SVG pour le glow */}
          {isLetter && (
            <text
              x="50" y="62"
              textAnchor="middle"
              fill={tier.neon}
              fontFamily="sans-serif"
              fontWeight="900"
              fontSize={s.letter}
              filter={`url(#innerGlow-${uid})`}
            >
              {letter.toUpperCase()}
            </text>
          )}
        </svg>

        {/* Icône lucide superposée (parfaitement centrée dans l'hexagone) */}
        {IconComp && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ paddingBottom: '4%' /* aligné visuellement dans l'hex */ }}
          >
            <IconComp
              size={s.icon}
              strokeWidth={2.4}
              color={tier.neon}
              style={{ filter: `drop-shadow(0 0 5px ${tier.glow}) drop-shadow(0 0 10px ${tier.neon})` }}
            />
          </div>
        )}
      </div>

      {/* Pastille numéro (en bas, chevauchante) */}
      <div
        className={cn(
          'relative -mt-3 flex items-center justify-center rounded-full border-2 border-white font-display font-black tabular-nums shadow-lg',
          s.num,
        )}
        style={{
          background: `linear-gradient(135deg, ${tier.glow}, ${tier.neon})`,
          color: '#fff',
          textShadow: '0 1px 0 rgba(0,0,0,0.35)',
          boxShadow: `0 0 10px ${tier.neon}88, 0 2px 4px rgba(0,0,0,0.25)`,
        }}
      >
        {level}
      </div>
    </div>
  )
}
