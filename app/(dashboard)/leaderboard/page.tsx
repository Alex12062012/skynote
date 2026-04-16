import { redirect } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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

  // Récupérer le rôle pour adapter l'affichage
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isObserver = currentProfile?.role === 'teacher' || currentProfile?.role === 'student'

  // Récupérer les classroom_ids où skycoins_in_ranking = false
  const { data: hiddenSettings } = await supabase
    .from('classroom_settings')
    .select('classroom_id')
    .eq('skycoins_in_ranking', false)

  const hiddenClassroomIds = (hiddenSettings || []).map((s: any) => s.classroom_id)

  // Top 10 — exclure les élèves des classes qui ont désactivé l'option
  let query = supabase
    .from('profiles')
    .select('id, full_name, pseudo, user_number, sky_coins, plan, streak_days, classroom_id, role')
    .order('sky_coins', { ascending: false })
    .limit(20) // on récupère plus pour pouvoir filtrer et garder 10

  const { data: rawTop } = await query

  const top100 = (rawTop || [])
    .filter((p: any) => {
      // Exclure les élèves dont la classe a désactivé le classement global
      if (p.role === 'student' && p.classroom_id && hiddenClassroomIds.includes(p.classroom_id)) {
        return false
      }
      return true
    })
    .slice(0, 10)

  const myRankInTop10 = (top100 || []).findIndex(p => p.id === user.id)
  const myRank = myRankInTop10 >= 0 ? myRankInTop10 + 1 : null
  const isInTop10 = myRankInTop10 >= 0
  const myProfile = (top100 || []).find(p => p.id === user.id)

  // Si pas dans le top 10, chercher les infos de l'utilisateur
  let myCoins = 0
  let myPseudo = null
  let myUserNumber = 0
  let needsPseudo = false
  if (!isInTop10) {
    const { data: mp } = await supabase
      .from('profiles')
      .select('sky_coins, pseudo, user_number')
      .eq('id', user.id)
      .single()
    myCoins = mp?.sky_coins ?? 0
    myPseudo = mp?.pseudo
    myUserNumber = mp?.user_number ?? 0
  } else {
    needsPseudo = !myProfile?.pseudo
    myPseudo = myProfile?.pseudo
    myUserNumber = myProfile?.user_number ?? 0
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
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
          Classement
        </h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Top 10 des meilleurs collecteurs de Sky Coins
        </p>
      </div>

      {/* Profs et élèves : spectateurs uniquement */}
      {isObserver && (
        <div className="mb-6 flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface px-5 py-3.5 dark:border-night-border dark:bg-night-surface">
          <span className="text-lg">👀</span>
          <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Vous consultez le classement en mode spectateur.
          </p>
        </div>
      )}

      {/* Demande de pseudo si dans le top 10 sans pseudo */}
      {!isObserver && isInTop10 && needsPseudo && (
        <PseudoModal userId={user.id} />
      )}

      {/* Ma position si pas dans le top 10 */}
      {!isObserver && !isInTop10 && (
        <div className="mb-6 flex items-center gap-4 rounded-card border border-brand/20 bg-brand-soft px-5 py-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-[16px] font-bold text-brand dark:text-brand-dark">
            ?
          </div>
          <div className="flex-1">
            <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
              Tu n'es pas encore dans le top 10
            </p>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Tu as{' '}
              <span className="font-bold text-brand dark:text-brand-dark">
                {myCoins} coins
              </span>
              {' '}— continue de reviser pour monter !
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
          const displayName = getDisplayName(profile, isMe)

          return (
            <div key={profile.id}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5 transition-colors',
                index > 0 && 'border-t border-sky-border dark:border-night-border',
                isMe && 'bg-brand-soft dark:bg-brand-dark-soft'
              )}>
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
              <div className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] font-bold',
                isMe
                  ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                  : 'bg-sky-cloud text-text-secondary dark:bg-night-border dark:text-text-dark-secondary'
              )}>
                {(displayName)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'font-body text-[14px] font-semibold truncate',
                    isMe ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main'
                  )}>
                    {displayName}
                  </p>
                  {profile.streak_days >= 7 && (
                    <span className="text-[12px]" title={profile.streak_days + ' jours de streak'}>🔥</span>
                  )}
                  {(profile.plan === 'plus' || profile.plan === 'premium') && <span className="text-[11px]">⭐</span>}
                  {profile.plan === 'famille' && <span className="text-[11px]">👨‍👩‍👧</span>}
                </div>
              </div>
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

      {isInTop10 && myRank && (
        <p className="mt-4 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          {myRank === 1 ? 'Tu es 1er du classement !' :
           myRank === 2 ? 'Tu es 2eme du classement !' :
           myRank === 3 ? 'Tu es 3eme du classement !' :
           myRank <= 10 ? 'Tu es #' + myRank + ' du classement — dans le top 10 !' :
           'Tu es #' + myRank + ' du classement'}
        </p>
      )}

      <p className="mt-6 text-center font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
        Mis a jour en temps reel · Seul le pseudo est affiche
      </p>
    </div>
  )
}

// PseudoForm est maintenant le composant client PseudoModal importé depuis components/leaderboard/PseudoModal.tsx

