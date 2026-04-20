import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/lib/supabase/gamification-actions'
import { LeaderboardClient } from '@/components/gamification/LeaderboardClient'
import { PseudoModal } from '@/components/leaderboard/PseudoModal'
import { getServerLocale, createServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Classement — Skynote' }
export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const locale = await getServerLocale()
  const t = createServerT(locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Mode par défaut = all_time : affiche tout de suite la vraie hiérarchie
  // (en weekly, tant qu'on est lundi/mardi, quasi tout le monde est à 0 et
  //  le classement semble vide)
  const { rows, me } = await getLeaderboard('all_time')

  // Forcer le choix d'un pseudo si pas encore défini
  const { data: myProf } = await supabase
    .from('profiles').select('pseudo, role').eq('id', user.id).single()
  const needsPseudo = !myProf?.pseudo && myProf?.role !== 'teacher'

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <header className="mb-6">
        <h1 className="font-display text-h2 font-black text-text-main dark:text-text-dark-main">
          {t('leaderboard.title')}
        </h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          {t('leaderboard.subtitle')}
        </p>
      </header>

      {needsPseudo && <PseudoModal userId={user.id} />}

      <LeaderboardClient
        initialRows={rows}
        initialMe={me}
        initialMode="all_time"
        currentUserId={user.id}
      />
    </div>
  )
}
