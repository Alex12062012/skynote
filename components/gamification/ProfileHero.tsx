'use client'

import { Flame, Trophy, Target, Sparkles, Heart } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { RainbowText } from '@/components/ui/RainbowText'
import { PlayerEmblem } from './PlayerEmblem'
import { LikeButton } from './LikeButton'
import { TITLES } from '@/lib/gamification/config'
import type { PublicProfile } from '@/lib/supabase/gamification-actions'

interface ProfileHeroProps {
  profile: PublicProfile
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  const displayName = profile.pseudo ?? `user_${profile.user_number ?? '?'}`
  const activeTitle = TITLES.find(t => t.id === profile.active_title_id)
  const unlockedTitles = profile.unlocked_titles
    .map(id => TITLES.find(t => t.id === id))
    .filter((t): t is (typeof TITLES)[number] => Boolean(t))

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-card border border-sky-border bg-gradient-to-br from-brand-soft via-white to-sky-cloud p-6 shadow-card dark:border-night-border dark:from-brand-dark-soft dark:via-night-surface dark:to-night-bg">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
          {/* Emblème XL (hexagone prestige ou badge rond selon niveau) */}
          <div className="flex flex-col items-center gap-2">
            <PlayerEmblem
              prestigeLevel={profile.prestige_level}
              badgeId={profile.active_badge_id}
              letter={displayName[0] ?? '?'}
              size="xl"
              glow
              animated
            />
          </div>

          {/* Infos */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-[32px] font-black leading-tight text-text-main dark:text-text-dark-main">
              {displayName}
            </h1>
            {activeTitle && (
              <div className="mt-0.5">
                <RainbowText className="font-display text-[14px] font-bold italic">
                  « {activeTitle.label} »
                </RainbowText>
              </div>
            )}
            {profile.bio && (
              <p className="mt-2 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                {profile.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <div className="flex items-center gap-1.5 rounded-pill bg-white px-3 py-1 shadow-sm dark:bg-night-surface">
                <SkyCoin size={16} />
                <span className="font-display text-[14px] font-bold tabular-nums">
                  {profile.sky_coins.toLocaleString('fr-FR')}
                </span>
              </div>
              {profile.streak_days > 0 && (
                <div className="flex items-center gap-1.5 rounded-pill bg-orange-100 px-3 py-1 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="font-display text-[13px] font-bold">{profile.streak_days} j</span>
                </div>
              )}
              {!profile.is_self && profile.viewer_liked !== null && (
                <LikeButton
                  targetUserId={profile.id}
                  initialLiked={profile.viewer_liked}
                  initialCount={profile.likes_received}
                />
              )}
              {profile.is_self && (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-sky-border px-3 py-1 font-body text-[12px] text-text-tertiary dark:border-night-border">
                  <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> {profile.likes_received} likes reçus
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCell icon={<Target className="h-5 w-5" />} label="QCM réussis"
          value={profile.stats.qcm_perfect.toLocaleString('fr-FR')} />
        <StatCell icon={<Trophy className="h-5 w-5" />} label="Taux de réussite"
          value={`${profile.stats.success_rate}%`} />
        <StatCell icon={<SkyCoin size={20} />} label="Coins lifetime"
          value={profile.stats.total_coins_earned.toLocaleString('fr-FR')} />
        <StatCell icon={<Sparkles className="h-5 w-5" />} label="Meilleur streak"
          value={`×${profile.stats.best_perfect_streak}`} />
      </div>

      {/* Titres débloqués */}
      {unlockedTitles.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-h4 font-bold text-text-main dark:text-text-dark-main">
            Titres débloqués ({unlockedTitles.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {unlockedTitles.map(t => (
              <span
                key={t.id}
                className={
                  'rounded-pill border-2 px-3 py-1 font-display text-[12px] font-bold ' +
                  (t.id === profile.active_title_id
                    ? 'border-brand bg-brand text-white'
                    : 'border-sky-border bg-sky-surface text-text-secondary dark:border-night-border dark:bg-night-surface dark:text-text-dark-secondary')
                }
                title={t.desc}
              >
                {t.label}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card border border-sky-border bg-sky-surface p-4 text-center dark:border-night-border dark:bg-night-surface">
      <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand dark:bg-brand-dark-soft dark:text-brand-dark">
        {icon}
      </div>
      <p className="font-display text-[20px] font-black tabular-nums text-text-main dark:text-text-dark-main">
        {value}
      </p>
      <p className="font-body text-[11px] uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
        {label}
      </p>
    </div>
  )
}
