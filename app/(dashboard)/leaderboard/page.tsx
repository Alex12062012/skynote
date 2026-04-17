import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/lib/supabase/gamification-actions'
import { LeaderboardClient } from '@/components/gamification/LeaderboardClient'
import { PseudoModal } from '@/components/leaderboard/PseudoModal'

export const metadata: Metadata = { title: 'Classement — Skynote' }
export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { rows, me } = await getLeaderboard('weekly')

  // Forcer le choix d'un pseudo si pas encore défini
  const { data: myProf } = await supabase
    .from('profiles').select('pseudo, role').eq('id', user.id).single()
  const needsPseudo = !myProf?.pseudo && myProf?.role !== 'teacher'

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <header className="mb-6">
        <h1 className="font-display text-h2 font-black text-text-main dark:text-text-dark-main">
          Classement
        </h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Affronte les meilleurs collecteurs de Sky Coins de Skynote.
        </p>
      </header>

      {needsPseudo && <PseudoModal userId={user.id} />}

      <LeaderboardClient
        initialRows={rows}
        initialMe={me}
        initialMode="weekly"
        currentUserId={user.id}
      />
    </div>
  )
}
