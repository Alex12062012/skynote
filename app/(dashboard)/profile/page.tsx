import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/supabase/actions'
import { PlanBadge, BetaBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getInitials, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { NameChangeForm } from '@/components/profile/NameChangeForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const [{ count: coursesCount }, { count: qcmCount }, { count: perfectCount }] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'ready'),
    supabase.from('qcm_attempts').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('qcm_attempts').select('id', { count: 'exact' }).eq('user_id', user.id).eq('perfect', true),
  ])

  const coins = profile?.sky_coins ?? 0
  const isPremium = profile?.plan === 'premium'

  return (
    <div className="mx-auto max-w-lg flex flex-col gap-6 animate-fade-in">
      <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Mon profil</h1>

      {/* Avatar + infos */}
      <div className="flex items-center gap-5 rounded-card border border-sky-border bg-sky-surface p-6 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-brand font-display text-[22px] font-bold text-white">
          {getInitials(profile?.full_name || user.email || 'U')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-h4 text-text-main dark:text-text-dark-main truncate">
            {profile?.full_name ?? 'Anonyme'}
          </p>
          <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary truncate">{user.email}</p>
          <NameChangeForm currentName={profile?.full_name ?? null} nameChangedAt={profile?.name_changed_at ?? null} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PlanBadge plan={profile?.plan ?? 'free'} />
            {profile?.is_beta_tester && <BetaBadge />}
            {isPremium && profile?.plan_expires_at && (
              <span className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                expire le {formatDate(profile.plan_expires_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sky Coins */}
      <div className="rounded-card border border-sky-border bg-sky-surface p-5 dark:border-night-border dark:bg-night-surface">
        <div className="flex items-center gap-4 mb-3">
          <SkyCoin size={44} />
          <div className="flex-1">
            <p className="font-display text-[28px] font-bold leading-none text-text-main dark:text-text-dark-main">
              {coins.toLocaleString('fr-FR')}{' '}
              <span className="font-body text-[14px] font-normal text-text-tertiary">Sky Coins</span>
            </p>
            {isFree && (
              <>
                <ProgressBar value={Math.min(coins, 750)} max={750} className="mt-2" />
                <p className="mt-1 font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                  {Math.max(0, 750 - coins)} coins manquants pour 1 mois Plus
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/objectives" className="flex-1 flex items-center justify-center h-9 rounded-input border border-sky-border font-body text-[13px] font-medium text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary transition-colors">
            🎯 Objectifs
          </Link>
          <Link href="/leaderboard" className="flex-1 flex items-center justify-center h-9 rounded-input border border-sky-border font-body text-[13px] font-medium text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary transition-colors">
            🏆 Classement
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cours', value: coursesCount ?? 0, icon: '📚' },
          { label: 'QCM faits', value: qcmCount ?? 0, icon: '⚡' },
          { label: 'Score parfaits', value: perfectCount ?? 0, icon: '🏆' },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-sky-border bg-sky-surface p-4 text-center dark:border-night-border dark:bg-night-surface">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-display text-[22px] font-bold leading-none text-text-main dark:text-text-dark-main">{s.value}</p>
            <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
        <span className="text-3xl">🔥</span>
        <div>
          <p className="font-display text-[20px] font-bold text-text-main dark:text-text-dark-main">
            {profile?.streak_days ?? 0} jours consécutifs
          </p>
          <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Connecte-toi chaque jour pour garder ton streak !
          </p>
        </div>
      </div>

      <p className="text-center font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
        Membre depuis {profile?.created_at ? formatDate(profile.created_at) : '—'}
      </p>

      {/* Mise à niveau — seulement pour les gratuits */}
      {isFree && (
        <Link href="/pricing"
          className="flex items-center justify-between rounded-card border border-brand/30 bg-brand-soft p-5 hover:bg-brand/10 transition-colors dark:border-brand-dark/30 dark:bg-brand-dark-soft">
          <div>
            <p className="font-display text-[16px] font-bold text-brand dark:text-brand-dark">
              ⭐ Passer au plan Plus
            </p>
            <p className="font-body text-[13px] text-brand/70 dark:text-brand-dark/70 mt-0.5">
              Cours illimités, vocal, et plus encore
            </p>
          </div>
          <span className="font-body text-[14px] font-bold text-brand dark:text-brand-dark">4,99€/mois →</span>
        </Link>
      )}

      <form action={signOut}>
        <Button type="submit" variant="ghost" className="w-full text-error hover:bg-error/10">
          Se déconnecter
        </Button>
      </form>

      <p className="text-center font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
        Skynote respecte ta vie privée. Tes données ne sont jamais vendues.
      </p>
    </div>
  )
}
