'use client'

import { Brain, Star, Rocket, Crown, Gem, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BADGES } from '@/lib/gamification/config'

const ICON_MAP = { Brain, Star, Rocket, Crown, Gem, Flame } as const

export type PlayerBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<PlayerBadgeSize, { box: string; icon: number; letter: string; ring: string }> = {
  xs: { box: 'h-7  w-7',  icon: 14, letter: 'text-[11px]', ring: 'ring-2' },
  sm: { box: 'h-9  w-9',  icon: 18, letter: 'text-[14px]', ring: 'ring-2' },
  md: { box: 'h-12 w-12', icon: 24, letter: 'text-[18px]', ring: 'ring-2' },
  lg: { box: 'h-20 w-20', icon: 40, letter: 'text-[30px]', ring: 'ring-4' },
  xl: { box: 'h-28 w-28', icon: 56, letter: 'text-[44px]', ring: 'ring-4' },
}

interface PlayerBadgeProps {
  badgeId: string
  letter: string                 // lettre fallback (première lettre du pseudo)
  size?: PlayerBadgeSize
  className?: string
  /** ajoute l'halo animé (utile pour gros badges profil) */
  glow?: boolean
}

/**
 * Badge cosmétique du joueur — cartoon, couleurs vives, style Brawl Stars.
 * Si badgeId === 'letter' → affiche la lettre du pseudo (fallback par défaut).
 */
export function PlayerBadge({ badgeId, letter, size = 'md', className, glow = false }: PlayerBadgeProps) {
  const conf = BADGES.find(b => b.id === badgeId) ?? BADGES[0]
  const s    = SIZES[size]
  const IconComp = conf.icon !== 'letter' ? (ICON_MAP as any)[conf.icon] : null

  return (
    <div
      className={cn(
        'relative flex flex-shrink-0 items-center justify-center rounded-full font-display font-black text-white transition-transform',
        'hover:scale-110 active:scale-95',
        s.box, s.ring, className,
      )}
      style={{
        background: `radial-gradient(circle at 30% 25%, ${conf.color}FF 0%, ${conf.color}CC 60%, ${conf.color}88 100%)`,
        boxShadow:
          `0 4px 12px ${conf.color}55, inset 0 -4px 8px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.4)`,
        borderColor: '#fff',
      }}
    >
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full blur-xl opacity-50 animate-pulse"
          style={{ background: conf.color }}
        />
      )}
      {IconComp ? (
        <IconComp size={s.icon} strokeWidth={2.75} />
      ) : (
        <span className={cn('tabular-nums drop-shadow-sm', s.letter)}>{letter.toUpperCase()}</span>
      )}
    </div>
  )
}
