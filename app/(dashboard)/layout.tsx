export const revalidate = 30

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { SkyBackground } from '@/components/ui/SkyBackground'
import { StreakTracker } from '@/components/dashboard/StreakTracker'
import { CoinRewardProvider } from '@/components/providers/CoinRewardProvider'
import { FeedbackButton } from '@/components/ui/FeedbackButton'
import { FeedbackTrigger } from '@/components/providers/FeedbackTrigger'
import { CoinRain } from '@/components/ui/CoinRain'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: betaRow }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('admin_settings').select('value').eq('key', 'beta_mode').maybeSingle(),
  ])

  // Table user_boosts peut ne pas exister en dev — on protège
  let boostActive = false
  try {
    const { data: boostRow } = await supabase
      .from('user_boosts')
      .select('expires_at')
      .eq('user_id', user.id)
      .eq('boost_type', 'x2_coins')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    boostActive = Boolean(boostRow)
  } catch { /* table absente */ }

  const isBetaEnabled = betaRow?.value === 'true'

  return (
    <CoinRewardProvider>
    <div className="min-h-screen">
      <SkyBackground />
      <Navbar profile={profile as Profile | null} isBetaEnabled={isBetaEnabled} />
      {/* Mise à jour silencieuse du streak de connexion */}
      <StreakTracker userId={user.id} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <CoinRain active={boostActive} />
      <FeedbackButton userId={user.id} />
      <FeedbackTrigger
        userId={user.id}
        initialShown5={profile?.feedback_shown_5 ?? false}
        initialShown25={profile?.feedback_shown_25 ?? false}
      />
    </div>
    </CoinRewardProvider>
  )
}
