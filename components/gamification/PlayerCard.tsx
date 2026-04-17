'use client'

import Link from 'next/link'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { PlayerEmblem } from './PlayerEmblem'
import { TITLES } from '@/lib/gamification/config'

export interface PlayerCardData {
  id: string
  pseudo: string | null
  user_number: number | null
  prestige_level: number
  active_title_id: string | null
  active_badge_id: string
  coins: number               // weekly, monthly ou all-time selon le contexte
  streak_days?: number
  plan?: string
}

interface PlayerCardProps {
  rank: number
  player: PlayerCardData
  isMe?: boolean
  href?: string               // lien profil public
}

/**
 * Carte joueur pour le leaderboard.
 * Style Brawl Stars : badge central gros, prestige AU-DESSUS, titre EN DESSOUS.
 */
export function PlayerCard({ rank, player, isMe, href }: PlayerCardProps) {
  const displayName = player.pseudo ?? `user_${player.user_number ?? '?'}`
  const title = TITLES.find(t => t.id === player.active_title_id)?.label ?? null
  const medal = ['🥇', '🥈', '🥉'][rank - 1]

  const inner = (
    <div
      className={cn(
        'group relative flex items-center gap-4 rounded-card border px-4 py-3 transition-all',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        isMe
          ? 'border-brand/40 bg-brand-soft dark:border-brand-dark/40 dark:bg-brand-dark-soft'
          : 'border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface',
      )}
    >
      {/* Rang */}
      <div className="flex w-10 flex-shrink-0 items-center justify-center">
        {medal ? (
          <span className="text-[26px] drop-shadow">{medal}</span>
        ) : (
          <span
            className={cn(
              'font-display text-[16px] font-black tabular-nums',
              isMe ? 'text-brand dark:text-brand-dark' : 'text-text-tertiary dark:text-text-dark-tertiary',
            )}
          >
            #{rank}
          </span>
        )}
      </div>

      {/* Emblème (badge rond OU hexagone prestige) */}
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
          <p
            className={cn(
              'truncate font-display text-[15px] font-bold',
              isMe ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main',
            )}
          >
            {displayName}
            {isMe && <span className="ml-1 text-text-tertiary">(toi)</span>}
          </p>
          {(player.streak_days ?? 0) >= 7 && (
            <Flame className="h-3.5 w-3.5 text-orange-500" title={`${player.streak_days} j`} />
          )}
          {(player.plan === 'plus' || player.plan === 'premium') && (
            <span className="text-[11px]" title="Plus">⭐</span>
          )}
        </div>
        {title && (
          <p className="truncate font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
            {title}
          </p>
        )}
      </div>

      {/* Coins */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <SkyCoin size={20} />
        <span
          className={cn(
            'font-display text-[16px] font-black tabular-nums',
            isMe ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main',
          )}
        >
          {player.coins.toLocaleString('fr-FR')}
        </span>
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
