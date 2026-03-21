import { redirect } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Classement — Skynote' }

export default async function LeaderboardPage() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Auth check with regular client
  const { createClient } = await import('@/lib/supabase/server')
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  // Top 100
  const { data: top100 } = await supabase
    .from('profiles')
    .select('id, full_name, sky_coins, plan, streak_days')
    .order('sky_coins', { ascending: false })
    .limit(100)

  // Rang de l'utilisateur connecté
  const { count: userRank } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .gt('sky_coins', top100?.find(p => p.id === user.id)?.sky_coins ?? 0)

  const myRank = (userRank ?? 0) + 1
  const myProfile = top100?.find(p => p.id === user.id)
  const isInTop100 = !!myProfile

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
          Classement 🏆
        </h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Top 100 des meilleurs collecteurs de Sky Coins
        </p>
      </div>

      {/* Ma position si pas dans le top 100 */}
      {!isInTop100 && (
        <div className="mb-6 flex items-center gap-4 rounded-card border border-brand/20 bg-brand-soft px-5 py-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-[16px] font-bold text-brand dark:text-brand-dark">
            #{myRank.toLocaleString('fr-FR')}
          </div>
          <div className="flex-1">
            <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
              Ta position
            </p>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Tu es #{myRank.toLocaleString('fr-FR')} avec{' '}
              <span className="font-bold text-brand dark:text-brand-dark">
                {top100?.find(p => p.id === user.id)?.sky_coins ?? 0} coins
              </span>
            </p>
          </div>
          <SkyCoin size={32} />
        </div>
      )}

      {/* Classement */}
      <div className="rounded-card border border-sky-border bg-sky-surface overflow-hidden dark:border-night-border dark:bg-night-surface">
        {(top100 || []).map((profile, index) => {
          const rank = index + 1
          const isMe = profile.id === user.id
          const medal = MEDALS[index]

          return (
            <div key={profile.id}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5 transition-colors',
                index > 0 && 'border-t border-sky-border dark:border-night-border',
                isMe && 'bg-brand-soft dark:bg-brand-dark-soft'
              )}>

              {/* Rang */}
              <div className="flex w-10 flex-shrink-0 items-center justify-center">
                {medal ? (
                  <span className="text-[20px]">{medal}</span>
                ) : (
                  <span className={cn(
                    'font-display text-[14px] font-bold tabular-nums',
                    isMe ? 'text-brand dark:text-brand-dark' : 'text-text-tertiary dark:text-text-dark-tertiary'
                  )}>
                    #{rank}
                  </span>
                )}
              </div>

              {/* Avatar initial */}
              <div className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] font-bold',
                isMe
                  ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                  : 'bg-sky-cloud text-text-secondary dark:bg-night-border dark:text-text-dark-secondary'
              )}>
                {(profile.full_name || '?')[0].toUpperCase()}
              </div>

              {/* Prénom + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'font-body text-[14px] font-semibold truncate',
                    isMe ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main'
                  )}>
                    {profile.full_name?.split(' ')[0] || 'Anonyme'}
                    {isMe && ' (toi)'}
                  </p>
                  {profile.streak_days >= 7 && (
                    <span className="text-[12px]" title={`${profile.streak_days} jours de streak`}>🔥</span>
                  )}
                  {(profile.plan === 'plus' || profile.plan === 'premium') && (
                    <span className="text-[11px]">⭐</span>
                  )}
                  {profile.plan === 'famille' && (
                    <span className="text-[11px]">👨‍👩‍👧</span>
                  )}
                </div>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <SkyCoin size={18} />
                <span className={cn(
                  'font-display text-[15px] font-bold tabular-nums',
                  isMe ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main'
                )}>
                  {profile.sky_coins.toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ma position en bas si dans le top 100 */}
      {isInTop100 && (
        <p className="mt-4 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          Tu es #{myRank} dans le classement 🎉
        </p>
      )}

      <p className="mt-6 text-center font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
        Mis à jour en temps réel · Seul le prénom est affiché
      </p>
    </div>
  )
}
