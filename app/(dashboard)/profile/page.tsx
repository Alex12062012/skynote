import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/supabase/actions'
import { PlanBadge, BetaBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getInitials, formatDate } from '@/lib/utils'
import Link from 'next/link'
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
      <div className="flex items-center gap-4 rounded-card border border-sky-border bg-sky-surface p-5 dark:border-night-border dark:bg-night-surface">
        <SkyCoin size={48} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-display text-[28px] font-bold leading-none text-text-main dark:text-text-dark-main">
              {coins}{' '}
              <span className="font-body text-[14px] font-normal text-text-tertiary">Sky Coins</span>
            </p>
            <Link href="/objectives">
              <Button size="sm" variant="ghost" className="text-[13px]">Objectifs →</Button>
            </Link>
          </div>
          {!isPremium && (
            <>
              <ProgressBar value={coins} max={100} />
              <p className="mt-1 font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                {Math.max(0, 100 - coins)} coins manquants pour Premium
              </p>
            </>
          )}
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
