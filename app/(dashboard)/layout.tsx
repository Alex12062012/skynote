import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { SkyBackground } from '@/components/ui/SkyBackground'
import { StreakTracker } from '@/components/dashboard/StreakTracker'
import { CoinRewardProvider } from '@/components/providers/CoinRewardProvider'
import { FeedbackButton } from '@/components/ui/FeedbackButton'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <CoinRewardProvider>
    <div className="min-h-screen">
      <SkyBackground />
      <Navbar profile={profile as Profile | null} />
      {/* Mise à jour silencieuse du streak de connexion */}
      <StreakTracker userId={user.id} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <FeedbackButton userId={user.id} />
    </div>
    </CoinRewardProvider>
  )
}
