import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BoutiqueClientV2 } from '@/components/gamification/BoutiqueClientV2'

export const metadata: Metadata = { title: 'Boutique — Skynote' }
export const dynamic = 'force-dynamic'

export default async function BoutiquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: badges }, { data: titles }, { data: spins }] = await Promise.all([
    supabase.from('profiles')
      .select('sky_coins, prestige_level, active_badge_id, active_title_id')
      .eq('id', user.id).single(),
    supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    supabase.from('user_titles').select('title_id').eq('user_id', user.id),
    supabase.from('wheel_spins')
      .select('segment_id, reward_type, net_gain, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <BoutiqueClientV2
      initialCoins={profile?.sky_coins ?? 0}
      prestigeLevel={profile?.prestige_level ?? 0}
      ownedBadges={(badges ?? []).map((b: any) => b.badge_id)}
      ownedTitles={(titles ?? []).map((t: any) => t.title_id)}
      activeBadge={profile?.active_badge_id ?? 'letter'}
      activeTitle={profile?.active_title_id ?? null}
      recentSpins={spins ?? []}
    />
  )
}
