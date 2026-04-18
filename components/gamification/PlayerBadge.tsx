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

const FRAME_STYLES: Record<string, { ring: string; shadow: string }> = {
  rare:      { ring: 'ring-yellow-400',  shadow: '0 0 12px 3px rgba(250,204,21,0.7)' },
  legendary: { ring: 'ring-purple-500',  shadow: '0 0 16px 5px rgba(168,85,247,0.8)' },
}

interface PlayerBadgeProps {
  badgeId: string
  letter: string                 // lettre fallback (première lettre du pseudo)
  size?: PlayerBadgeSize
  className?: string
  /** ajoute l'halo animé (utile pour gros badges profil) */
  glow?: boolean
  /** rareté du cadre équipé — ajoute un ring coloré animé */
  frameRarity?: 'rare' | 'legendary' | null
}

/**
 * Badge cosmétique du joueur — cartoon, couleurs vives, style Brawl Stars.
 * Si badgeId === 'letter' → affiche la lettre du pseudo (fallback par défaut).
 */
export function PlayerBadge({ badgeId, letter, size = 'md', className, glow = false, frameRarity }: PlayerBadgeProps) {
  const conf = BADGES.find(b => b.id === badgeId) ?? BADGES[0]
  const s    = SIZES[size]
  const IconComp = conf.icon !== 'letter' ? (ICON_MAP as any)[conf.icon] : null
  const frame = frameRarity ? FRAME_STYLES[frameRarity] : null

  return (
    <div
      className={cn(
        'relative flex flex-shrink-0 items-center justify-center rounded-full font-display font-black text-white transition-transform',
        'hover:scale-110 active:scale-95',
        s.box, s.ring,
        frame ? `ring-4 ${frame.ring} animate-pulse` : '',
        className,
      )}
      style={{
        background: `radial-gradient(circle at 30% 25%, ${conf.color}FF 0%, ${conf.color}CC 60%, ${conf.color}88 100%)`,
        boxShadow: frame
          ? `${frame.shadow}, inset 0 -4px 8px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.4)`
          : `0 4px 12px ${conf.color}55, inset 0 -4px 8px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.4)`,
        borderColor: '#fff',
      }}
    >
      {(glow || frame) && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full blur-xl opacity-50 animate-pulse"
          style={{ background: frame ? (frameRarity === 'legendary' ? '#a855f7' : '#facc15') : conf.color }}
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
