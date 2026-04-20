import { redirect } from 'next/navigation'
import { Lock, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PlanBadge } from '@/components/ui/Badge'
import { ReferralCard } from '@/components/objectives/ReferralCard'
import { ClaimButton } from '@/components/objectives/ClaimButton'
import { getReferralStats } from '@/lib/supabase/referral-actions'
import { cn, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import { getServerLocale, createServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Objectifs & Sky Coins' }

export default async function ObjectivesPage() {
  const locale = await getServerLocale()
  const t = createServerT(locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, objectivesRes, userObjectivesRes, transactionsRes, referralStats] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('objectives').select('*').order('reward_coins'),
    supabase.from('user_objectives').select('*').eq('user_id', user.id),
    supabase.from('coin_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    getReferralStats(user.id),
  ])

  const profile = profileRes.data

  // Profs et élèves : afficher un message bloquant
  if (profile?.role === 'teacher' || profile?.role === 'student') {
    return (
      <div className="mx-auto max-w-2xl flex flex-col items-center justify-center py-24 text-center gap-4 animate-fade-in">
        <Lock className="h-12 w-12 text-text-secondary dark:text-text-dark-secondary" />
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">{t('objectives.blockedTitle')}</h1>
        <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary max-w-sm">
          {profile.role === 'student'
            ? t('objectives.blockedStudent')
            : t('objectives.blockedTeacher')}
        </p>
      </div>
    )
  }

  const objectives = objectivesRes.data ?? []
  const userObjectives = userObjectivesRes.data ?? []
  const transactions = transactionsRes.data ?? []

  const userObjMap = new Map(userObjectives.map((uo: any) => [uo.objective_id, uo]))
  const coins = profile?.sky_coins ?? 0
  const isPremium = profile?.plan === 'plus'

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-8 animate-fade-in">
      <div>
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">{t('objectives.title')}</h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          {t('objectives.subtitle')}
        </p>
      </div>

      {/* Solde */}
      <div className="flex flex-col gap-4 rounded-card border border-sky-border bg-sky-surface p-6 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 flex-1">
          <SkyCoin size={64} />
          <div>
            <p className="font-body text-label-caps text-text-tertiary dark:text-text-dark-tertiary">{t('objectives.balance')}</p>
            <p className="font-display text-[44px] font-bold leading-none text-text-main dark:text-text-dark-main">{coins}</p>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mt-0.5">Sky Coins</p>
          </div>
        </div>

        {!isPremium ? (
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="rounded-card-sm border border-brand/20 bg-brand-soft px-4 py-3 dark:border-brand-dark/20 dark:bg-brand-dark-soft sm:text-right">
              <p className="font-display text-[15px] font-bold text-brand dark:text-brand-dark">{t('objectives.unlockPlus')}</p>
              <p className="font-body text-[13px] text-brand/70 dark:text-brand-dark/70">750 Sky Coins = 1 mois</p>
              <div className="mt-2">
                {coins >= 750 ? (
                  <a href="/pricing" className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-3 py-1.5 font-body text-[13px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg">
                    <SkyCoin size={14} /> Utiliser mes coins →
                  </a>
                ) : (
                  <div>
                    <ProgressBar value={coins} max={750} className="mb-1" />
                    <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">{coins} / 750 coins</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <PlanBadge plan="premium" />
            {profile?.plan_expires_at && (
              <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                {t('objectives.expireOn')} {formatDate(profile.plan_expires_at)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Parrainage */}
      <ReferralCard
        userId={user.id}
        initialCode={referralStats.code}
        referralsCount={referralStats.referralsCount}
      />

      {/* Défis */}
      <div>
        <h2 className="mb-4 font-display text-h3 text-text-main dark:text-text-dark-main">{t('objectives.challenges')}</h2>
        <div className="flex flex-col gap-3">
          {objectives.map((obj: any) => {
            const uo = userObjMap.get(obj.id)
            const current = uo?.current_value ?? 0
            const completed = uo?.completed ?? false
            const claimed = uo?.claimed ?? false
            const canClaim = completed && !claimed

            return (
              <div key={obj.id} className={cn(
                'flex items-center gap-4 rounded-card border p-5 transition-all',
                canClaim
                  ? 'border-brand/30 bg-brand-soft dark:border-brand-dark/30 dark:bg-brand-dark-soft'
                  : completed && claimed
                    ? 'border-success/30 bg-success-soft dark:border-emerald-800/30 dark:bg-emerald-950/20'
                    : 'border-sky-border bg-sky-surface shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark'
              )}>
                <span className="text-3xl flex-shrink-0">{obj.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className={cn('inline-flex items-center gap-1 font-body text-[14px] font-semibold',
                      canClaim ? 'text-brand dark:text-brand-dark'
                        : claimed ? 'text-success dark:text-success-dark'
                          : 'text-text-main dark:text-text-dark-main')}>
                      {obj.title}
                      {claimed && <Check className="h-3.5 w-3.5 text-green-600" />}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <SkyCoin size={14} />
                      <span className="font-body text-[13px] font-bold text-brand dark:text-brand-dark">
                        +{obj.reward_coins}
                      </span>
                    </div>
                  </div>
                  <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary mb-2">
                    {obj.description}
                  </p>

                  {/* Progression */}
                  {!completed && obj.target_value > 1 && (
                    <div className="space-y-1">
                      <ProgressBar value={current} max={obj.target_value} />
                      <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                        {current} / {obj.target_value}
                      </p>
                    </div>
                  )}

                  {/* Bouton Récupérer */}
                  {canClaim && (
                    <div className="mt-2">
                      <ClaimButton
                        objectiveId={obj.id}
                        rewardCoins={obj.reward_coins}
                        objectiveTitle={obj.title}
                        objectiveIcon={obj.icon}
                      />
                    </div>
                  )}

                  {/* Date de completion */}
                  {claimed && uo?.completed_at && (
                    <p className="font-body text-[11px] text-success/70 dark:text-success-dark/70">
                      {t('objectives.completedOn')} {formatDate(uo.completed_at)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Historique */}
      {transactions.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-h3 text-text-main dark:text-text-dark-main">{t('objectives.history')}</h2>
          <div className="rounded-card border border-sky-border bg-sky-surface overflow-hidden dark:border-night-border dark:bg-night-surface">
            {transactions.map((tx: any, i: number) => (
              <div key={tx.id} className={cn('flex items-center justify-between px-5 py-3.5',
                i > 0 && 'border-t border-sky-border dark:border-night-border')}>
                <div className="flex-1 mr-4 min-w-0">
                  <p className="font-body text-[14px] text-text-main dark:text-text-dark-main truncate">{tx.reason}</p>
                  <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary mt-0.5">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <SkyCoin size={14} />
                  <span className={cn('font-body text-[13px] font-bold tabular-nums',
                    tx.amount > 0 ? 'text-brand dark:text-brand-dark' : 'text-error')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
