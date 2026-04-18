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

  let wheelSpinCount = 0
  try {
    const { data } = await supabase
      .from('wheel_spins').select('segment_id, reward_type, net_gain, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    recentSpins = data ?? []
    // Compte total pour la barre de progression du titre "Pro du casino"
    const { count } = await supabase
      .from('wheel_spins').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    wheelSpinCount = count ?? 0
  } catch { /* table absente */ }

  const userStats = {
    total_qcm_perfect:   (profile as any)?.total_qcm_perfect   ?? 0,
    best_perfect_streak: (profile as any)?.best_perfect_streak  ?? 0,
    wheel_spins:         wheelSpinCount,
  }

  // Cadres (frames) depuis user_inventory
  let ownedFrames: Array<{ item_id: string; data: { name: string; rarity: string }; equipped: boolean }> = []
  try {
    const { data } = await supabase
      .from('user_inventory').select('item_id, data, equipped')
      .eq('user_id', user.id).eq('item_type', 'frame')
    ownedFrames = (data ?? []).map((f: any) => ({
      item_id: f.item_id,
      data: typeof f.data === 'object' ? f.data : {},
      equipped: Boolean(f.equipped),
    }))
  } catch { /* table absente */ }

  // Charges des consommables
  const now = new Date().toISOString()
  type ConsumableState = { x2_active: boolean; x2_expires: string | null; retry_qcm_charges: number; skip_question_charges: number }
  let consumableState: ConsumableState = { x2_active: false, x2_expires: null, retry_qcm_charges: 0, skip_question_charges: 0 }

  try {
    const { data: boosts } = await supabase
      .from('user_boosts').select('boost_type, expires_at, charges')
      .eq('user_id', user.id)
    if (boosts) {
      const x2 = boosts.find((b: any) => b.boost_type === 'x2_coins' && b.expires_at > now)
      consumableState.x2_active  = Boolean(x2)
      consumableState.x2_expires = (x2 as any)?.expires_at ?? null
      consumableState.retry_qcm_charges = boosts
        .filter((b: any) => b.boost_type === 'retry_qcm')
        .reduce((s: number, b: any) => s + (b.charges ?? 1), 0)
      consumableState.skip_question_charges = boosts
        .filter((b: any) => b.boost_type === 'skip_question')
        .reduce((s: number, b: any) => s + (b.charges ?? 1), 0)
    }
  } catch { /* table absente */ }

  return (
    <BoutiqueClientV2
      initialCoins={(profile as any)?.sky_coins ?? 0}
      prestigeLevel={(profile as any)?.prestige_level ?? 0}
      ownedBadges={ownedBadges}
      ownedTitles={ownedTitles}
      activeBadge={(profile as any)?.active_badge_id ?? 'letter'}
      activeTitle={(profile as any)?.active_title_id ?? null}
      ownedFrames={ownedFrames}
      activeFrame={(profile as any)?.active_frame_id ?? null}
      pseudo={(profile as any)?.pseudo ?? `user_${(profile as any)?.user_number ?? '?'}`}
      recentSpins={recentSpins}
      userStats={userStats}
      consumableState={consumableState}
    />
  )
}
