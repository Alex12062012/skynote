import { redirect } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Flame, Star } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { PseudoModal } from '@/components/leaderboard/PseudoModal'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Classement — Skynote' }

export default async function LeaderboardPage() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { createClient } = await import('@/lib/supabase/server')
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: top100 } = await supabase
    .from('profiles')
    .select('id, full_name, pseudo, user_number, sky_coins, plan, streak_days, classroom_id, role')
    .order('sky_coins', { ascending: false })
    .limit(200) // on récupère plus pour pouvoir filtrer et garder 100

  const { data: rawTop } = await query

  const top100 = (rawTop || [])
    .filter((p: any) => {
      // Exclure les élèves dont la classe a désactivé le classement global
      if (p.role === 'student' && p.classroom_id && hiddenClassroomIds.includes(p.classroom_id)) {
        return false
      }
      return true
    })
    .slice(0, 100)

  const myRankInTop100 = (top100 || []).findIndex((p) => p.id === user.id)
  const myRank = myRankInTop100 >= 0 ? myRankInTop100 + 1 : null
  const isInTop100 = myRankInTop100 >= 0
  const myProfile = (top100 || []).find((p) => p.id === user.id)

  let myCoins = 0
  let needsPseudo = false

  if (!isInTop100) {
    const { data: mp } = await supabase
      .from('profiles')
      .select('sky_coins, pseudo, user_number')
      .eq('id', user.id)
      .single()
    myCoins = mp?.sky_coins ?? 0
  } else {
    needsPseudo = !myProfile?.pseudo
  }

  function getDisplayName(profile: any, isMe: boolean): string {
    if (isMe) {
      if (profile.pseudo) return profile.pseudo + ' (toi)'
      const name = profile.full_name?.split(' ')[0] || 'Anonyme'
      return name + ' (toi)'
    }
    if (profile.pseudo) return profile.pseudo
    return 'user_' + (profile.user_number || '?')
  }

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Classement</h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Top 100 des meilleurs collecteurs de Sky Coins
        </p>
      </div>

      {/* Demande de pseudo */}
      {isInTop100 && needsPseudo && (
        <PseudoForm userId={user.id} />
      )}

      {/* Hors top 100 */}
      {!isInTop100 && (
        <div className="mb-6 flex items-center gap-4 rounded-card border border-brand/20 bg-brand-soft px-5 py-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-[16px] font-bold text-brand dark:text-brand-dark">
            ?
          </div>
          <div className="flex-1">
            <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
              Tu n'es pas encore dans le top 100
            </p>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Tu as{' '}
              <span className="font-bold text-brand dark:text-brand-dark">{myCoins} coins</span>
              {' '}— continue de réviser pour monter !
            </p>
          </div>
          <SkyCoin size={32} />
        </div>
      )}

      {/* Tableau */}
      <div className="rounded-card border border-sky-border bg-sky-surface overflow-hidden dark:border-night-border dark:bg-night-surface">
        {(top100 || []).map((profile, index) => {
          const rank = index + 1
          const isMe = profile.id === user.id
          const medal = MEDALS[index]
          const displayName = getDisplayName(profile, isMe)

          return (
            <div
              key={profile.id}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5 transition-colors',
                index > 0 && 'border-t border-sky-border dark:border-night-border',
                isMe && 'bg-brand-soft dark:bg-brand-dark-soft'
              )}
            >
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

              {/* Avatar */}
              <div className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] font-bold',
                isMe
                  ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                  : 'bg-sky-cloud text-text-secondary dark:bg-night-border dark:text-text-dark-secondary'
              )}>
                {displayName[0].toUpperCase()}
              </div>

              {/* Nom */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'font-body text-[14px] font-semibold truncate',
                    isMe ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main'
                  )}>
                    {displayName}
                  </p>
                  {profile.streak_days >= 7 && (
                    <Flame className="h-3.5 w-3.5 text-orange-500" title={`${profile.streak_days} jours de streak`} />
                  )}
                  {(profile.plan === 'plus' || profile.plan === 'premium' || profile.plan === 'famille') && (
                    <Star className="h-3.5 w-3.5 text-amber-500" />
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

      {/* Position dans le top */}
      {isInTop100 && myRank && (
        <p className="mt-4 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          {myRank === 1
            ? 'Tu es 1er du classement !'
            : myRank <= 3
            ? `Tu es ${myRank}ème du classement !`
            : myRank <= 10
            ? `Tu es #${myRank} du classement — dans le top 10 !`
            : `Tu es #${myRank} du classement`}
        </p>
      )}
      <p className="mt-6 text-center font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
        Mis a jour en temps reel
      </p>
    </div>
  )
}
