export const revalidate = 30

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { SkyBackground } from '@/components/ui/SkyBackground'
import { StreakTracker } from '@/components/dashboard/StreakTracker'
import { AdminMessageModal, type AdminMessage } from '@/components/dashboard/AdminMessageModal'
import { CoinRewardProvider } from '@/components/providers/CoinRewardProvider'
import { FeedbackButton } from '@/components/ui/FeedbackButton'
import { FeedbackTrigger } from '@/components/providers/FeedbackTrigger'
import { CoinRain } from '@/components/ui/CoinRain'
import { getNovaBalance } from '@/lib/supabase/nova-actions'
import { NovaUpgradeWidget } from '@/components/ui/NovaUpgradeWidget'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  // Une seule vague de requetes : chaque `await` sequentiel coute un
  // aller-retour Vercel → Supabase. getNovaBalance(user.id) evite en plus un
  // second auth.getUser() interne.
  const [{ data: profile }, novaBalance, unseenRes, boostRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getNovaBalance(user.id),
    // Message du jour actif non vu (RPC, 1 requete) — dans la meme vague,
    // aucun aller-retour supplementaire. `.then` neutre : une migration
    // manquante ne doit pas casser tout le dashboard.
    supabase.rpc('get_unseen_admin_message').then((r) => r, () => ({ data: null })),
    supabase
      .from('user_boosts')
      .select('expires_at')
      .eq('user_id', user.id)
      .eq('boost_type', 'x2_coins')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
      .then((r) => r, () => ({ data: null })), // table absente en dev
  ])
  const boostActive = Boolean(boostRes.data)
  const adminMessage = ((unseenRes.data as AdminMessage[] | null) ?? [])[0] ?? null

  return (
    <CoinRewardProvider>
    <div className="min-h-screen">
      <SkyBackground />
      <Navbar
        profile={profile as Profile | null}
        novaBalance={novaBalance}
        userId={user.id}
      />
      {/* Mise à jour silencieuse du streak de connexion */}
      <StreakTracker userId={user.id} />
      {/* Message du jour (admin) — une fois par utilisateur */}
      {adminMessage && <AdminMessageModal message={adminMessage} />}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <CoinRain active={boostActive} />
      <FeedbackButton userId={user.id} />

      {/* Widget upgrade Nova — Suspense requis par useSearchParams (détection ?payment=success) */}
      {profile && (
        <Suspense fallback={null}>
          <NovaUpgradeWidget
            plan={(profile as any).plan ?? 'free'}
          />
        </Suspense>
      )}

      <FeedbackTrigger
        userId={user.id}
        initialShown5={profile?.feedback_shown_5 ?? false}
        initialShown25={profile?.feedback_shown_25 ?? false}
      />
    </div>
    </CoinRewardProvider>
  )
}
