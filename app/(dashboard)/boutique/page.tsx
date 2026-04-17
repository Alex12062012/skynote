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

  // `select *` pour ne pas planter si une colonne manque (migration non poussée).
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  // Les tables peuvent ne pas exister : on encapsule en try/catch + coalesce
  let ownedBadges: string[] = []
  let ownedTitles: string[] = []
  let recentSpins: Array<{ segment_id: string; reward_type: string; net_gain: number; created_at: string }> = []

  try {
    const { data } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id)
    ownedBadges = (data ?? []).map((b: any) => b.badge_id)
  } catch { /* table absente */ }

  try {
    const { data } = await supabase.from('user_titles').select('title_id').eq('user_id', user.id)
    ownedTitles = (data ?? []).map((t: any) => t.title_id)
  } catch { /* table absente */ }

  try {
    const { data } = await supabase
      .from('wheel_spins').select('segment_id, reward_type, net_gain, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    recentSpins = data ?? []
  } catch { /* table absente */ }

  return (
    <BoutiqueClientV2
      initialCoins={(profile as any)?.sky_coins ?? 0}
      prestigeLevel={(profile as any)?.prestige_level ?? 0}
      ownedBadges={ownedBadges}
      ownedTitles={ownedTitles}
      activeBadge={(profile as any)?.active_badge_id ?? 'letter'}
      activeTitle={(profile as any)?.active_title_id ?? null}
      recentSpins={recentSpins}
    />
  )
}
