import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BoutiqueClient } from '@/components/boutique/BoutiqueClient'

export const metadata: Metadata = { title: 'Boutique — Skynote' }

export default async function BoutiquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('sky_coins')
    .eq('id', user.id)
    .single()

  // Derniers tours de roue
  const { data: recentSpins } = await supabase
    .from('wheel_spins')
    .select('segment_id, reward_type, net_gain, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <BoutiqueClient
      initialCoins={profile?.sky_coins ?? 0}
      recentSpins={recentSpins ?? []}
    />
  )
}
