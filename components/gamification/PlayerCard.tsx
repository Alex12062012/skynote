'use client'

import Link from 'next/link'
import { Flame, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { RainbowText } from '@/components/ui/RainbowText'
import { PlayerEmblem } from './PlayerEmblem'
import { TITLES, SKINS, SKIN_ID_ALIASES } from '@/lib/gamification/config'
import { SkinDecoration } from './SkinDecoration'

export interface PlayerCardData {
  id: string
  pseudo: string | null
  user_number: number | null
  prestige_level: number
  active_title_id: string | null
  active_badge_id: string
  active_frame_id?: string | null
  coins: number
  streak_days?: number
  plan?: string
}

interface PlayerCardProps {
  rank: number
  player: PlayerCardData
  isMe?: boolean
  href?: string
}

export function PlayerCard({ rank, player, isMe, href }: PlayerCardProps) {
  const displayName = player.pseudo ?? `user_${player.user_number ?? '?'}`
  const title = TITLES.find(t => t.id === player.active_title_id)?.label ?? null
  const medalColor = ['text-yellow-500', 'text-slate-400', 'text-amber-700'][rank - 1]
  const showMedal = rank >= 1 && rank <= 3

  // Résoudre le skin (avec alias rétrocompat)
  const rawSkinId = player.active_frame_id ?? null
  const skinId = rawSkinId ? (SKIN_ID_ALIASES[rawSkinId] ?? rawSkinId) : null
  const skin = skinId ? SKINS.find(s => s.id === skinId) : null

  const inner = (
    <div
      className={cn(
        'group relative overflow-hidden flex items-center gap-4 rounded-card border px-4 py-3 transition-all',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        skin
          ? skin.cardClass
          : isMe
            ? 'border-brand/40 bg-brand-soft dark:border-brand-dark/40 dark:bg-brand-dark-soft'
            : 'border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface',
      )}
      style={skin ? { boxShadow: skin.boxShadow } : undefined}
    >
      <SkinDecoration skinId={skinId} />

      {/* Contenu — z-10 pour passer au-dessus de la décoration SVG */}
      <div className="relative z-10 flex w-full items-center gap-4">
        {/* Rang */}
        <div className="flex w-10 flex-shrink-0 items-center justify-center">
          {showMedal ? (
            <Medal className={cn('h-7 w-7 drop-shadow', medalColor)} />
          ) : (
            <span className={cn(
              'font-display text-[16px] font-black tabular-nums',
              isMe ? 'text-brand dark:text-brand-dark' : 'text-text-tertiary dark:text-text-dark-tertiary',
            )}>
              #{rank}
            </span>
          )}
        </div>

        {/* Emblème */}
        <PlayerEmblem
          prestigeLevel={player.prestige_level}
          badgeId={player.active_badge_id}
          letter={displayName[0] ?? '?'}
          size="md"
          glow={rank <= 3}
          animated={rank <= 3}
        />

        {/* Nom + titre */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              'truncate font-display text-[15px] font-bold',
              isMe && !skin ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main',
            )}>
              {displayName}
              {isMe && <span className="ml-1 text-text-tertiary">(toi)</span>}
            </p>
            {(player.streak_days ?? 0) >= 7 && (
              <span title={`${player.streak_days} j de streak`} className="inline-flex">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
              </span>
            )}
          </div>
          {title && (
            <div className="truncate">
              <RainbowText className="font-body text-[12px] font-bold">{title}</RainbowText>
            </div>
          )}
        </div>

        {/* Coins */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <SkyCoin size={20} />
          <span className={cn(
            'font-display text-[16px] font-black tabular-nums',
            isMe && !skin ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main',
          )}>
            {player.coins.toLocaleString('fr-FR')}
          </span>
        </div>
      </div>
    </div>
  )

  if (!href) return inner
  return (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-card">
      {inner}
    </Link>
  )
}
