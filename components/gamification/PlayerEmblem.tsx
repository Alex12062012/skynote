'use client'

import { PlayerBadge, type PlayerBadgeSize } from './PlayerBadge'
import { PrestigeBadge, type PrestigeBadgeSize } from './PrestigeBadge'

interface PlayerEmblemProps {
  prestigeLevel: number
  badgeId: string
  letter: string
  size?: PlayerBadgeSize & PrestigeBadgeSize
  glow?: boolean
  animated?: boolean
  className?: string
}

/**
 * PlayerEmblem — wrapper intelligent.
 *  • prestigeLevel > 0 → PrestigeBadge hexagonal néon (façon Colt)
 *  • sinon             → PlayerBadge classique (rond coloré)
 *
 * Les deux composants partagent les mêmes tailles (xs/sm/md/lg/xl),
 * donc on peut basculer transparentement selon le niveau.
 */
export function PlayerEmblem({
  prestigeLevel,
  badgeId,
  letter,
  size = 'md',
  glow,
  animated,
  className,
}: PlayerEmblemProps) {
  if (prestigeLevel > 0) {
    return (
      <PrestigeBadge
        level={prestigeLevel}
        badgeId={badgeId}
        letter={letter}
        size={size}
        animated={animated}
        className={className}
      />
    )
  }
  return (
    <PlayerBadge
      badgeId={badgeId}
      letter={letter}
      size={size}
      glow={glow}
      className={className}
    />
  )
}
