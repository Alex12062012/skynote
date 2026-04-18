'use client'

import Link from 'next/link'
import { Flame, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { RainbowText } from '@/components/ui/RainbowText'
import { PlayerEmblem } from './PlayerEmblem'
import { TITLES } from '@/lib/gamification/config'

// ─── Skins de carte ──────────────────────────────────────────────────────────
// Chaque skin change le fond + la bordure de la carte dans le classement.
const CARD_SKINS: Record<string, {
  card: string        // classes pour le wrapper de la carte
  glow?: string       // halo optionnel (pseudo-element via boxShadow inline)
  boxShadow?: string
}> = {
  frame_etoile_rare: {
    card: 'border-yellow-400/70 bg-gradient-to-r from-amber-50 via-sky-surface to-yellow-50 dark:border-yellow-500/50 dark:from-amber-950/30 dark:via-night-surface dark:to-yellow-950/20',
    boxShadow: '0 0 0 1px rgba(250,204,21,0.4), 0 2px 12px rgba(250,204,21,0.2)',
  },
  frame_etoile_legendary: {
    card: 'border-purple-400/70 bg-gradient-to-r from-purple-50 via-sky-surface to-pink-50 dark:border-purple-500/50 dark:from-purple-950/30 dark:via-night-surface dark:to-pink-950/20',
    boxShadow: '0 0 0 1px rgba(168,85,247,0.5), 0 2px 16px rgba(168,85,247,0.25)',
  },
}

export interface PlayerCardData {
  id: string
  pseudo: string | null
  user_number: number | null
  prestige_level: number
  active_title_id: string | null
  active_badge_id: string
  active_frame_id?: string | null   // skin de carte équipé
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
 * Le skin (active_frame_id) change le fond et la bordure de la carte.
 */
export function PlayerCard({ rank, player, isMe, href }: PlayerCardProps) {
  const displayName = player.pseudo ?? `user_${player.user_number ?? '?'}`
  const title = TITLES.find(t => t.id === player.active_title_id)?.label ?? null
  const medalColor = ['text-yellow-500', 'text-slate-400', 'text-amber-700'][rank - 1]
  const showMedal = rank >= 1 && rank <= 3

  const skin = player.active_frame_id ? CARD_SKINS[player.active_frame_id] : null

  const inner = (
    <div
      className={cn(
        'group relative flex items-center gap-4 rounded-card border px-4 py-3 transition-all',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        // Skin en priorité, sinon style isMe, sinon défaut
        skin
          ? skin.card
          : isMe
            ? 'border-brand/40 bg-brand-soft dark:border-brand-dark/40 dark:bg-brand-dark-soft'
            : 'border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface',
      )}
      style={skin?.boxShadow ? { boxShadow: skin.boxShadow } : undefined}
    >
      {/* Rang */}
      <div className="flex w-10 flex-shrink-0 items-center justify-center">
        {showMedal ? (
          <Medal className={cn('h-7 w-7 drop-shadow', medalColor)} />
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
              isMe && !skin ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main',
            )}
          >
            {displayName}
            {isMe && <span className="ml-1 text-text-tertiary">(toi)</span>}
          </p>
          {(player.streak_days ?? 0) >= 7 && (
            <span title={`${player.streak_days} j de streak`} className="inline-flex">
              <Flame className="h-3.5 w-3.5 text-orange-500" aria-label={`${player.streak_days} jours de streak`} />
            </span>
          )}
        </div>
        {title && (
          <div className="truncate">
            <RainbowText className="font-body text-[12px] font-bold">
              {title}
            </RainbowText>
          </div>
        )}
      </div>

      {/* Coins */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <SkyCoin size={20} />
        <span
          className={cn(
            'font-display text-[16px] font-black tabular-nums',
            isMe && !skin ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main',
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
