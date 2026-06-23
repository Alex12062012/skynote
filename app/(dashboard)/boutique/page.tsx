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

  // Toutes les requêtes en parallèle — Promise.allSettled pour tolérer les tables absentes en dev
  const [
    profileResult,
    badgesResult,
    titlesResult,
    spinsResult,
    framesResult,
    boostsResult,
  ] = await Promise.allSettled([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    supabase.from('user_titles').select('title_id').eq('user_id', user.id),
    supabase
      .from('wheel_spins').select('segment_id, reward_type, net_gain, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase
      .from('user_inventory').select('item_id, data, equipped')
      .eq('user_id', user.id).eq('item_type', 'frame'),
    supabase
      .from('user_boosts').select('boost_type, expires_at, charges')
      .eq('user_id', user.id),
  ])

  const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null
  const ownedBadges = badgesResult.status === 'fulfilled'
    ? (badgesResult.value.data ?? []).map((b: any) => b.badge_id)
    : []
  const ownedTitles = titlesResult.status === 'fulfilled'
    ? (titlesResult.value.data ?? []).map((t: any) => t.title_id)
    : []
  const recentSpins: Array<{ segment_id: string; reward_type: string; net_gain: number; created_at: string }> =
    spinsResult.status === 'fulfilled' ? (spinsResult.value.data ?? []) : []
  const ownedFrames = framesResult.status === 'fulfilled'
    ? (framesResult.value.data ?? []).map((f: any) => ({
        item_id: f.item_id,
        data: typeof f.data === 'object' ? f.data : {},
        equipped: Boolean(f.equipped),
      }))
    : []

  const now = new Date().toISOString()
  type ConsumableState = { x2_active: boolean; x2_expires: string | null; retry_qcm_charges: number; hint_question_charges: number }
  let consumableState: ConsumableState = { x2_active: false, x2_expires: null, retry_qcm_charges: 0, hint_question_charges: 0 }

  if (boostsResult.status === 'fulfilled') {
    const boosts = boostsResult.value.data ?? []
    const x2 = boosts.find((b: any) => b.boost_type === 'x2_coins' && b.expires_at > now)
    consumableState = {
      x2_active:             Boolean(x2),
      x2_expires:            (x2 as any)?.expires_at ?? null,
      retry_qcm_charges:     boosts.filter((b: any) => b.boost_type === 'retry_qcm').reduce((s: number, b: any) => s + (b.charges ?? 1), 0),
      hint_question_charges: boosts.filter((b: any) => b.boost_type === 'hint_question').reduce((s: number, b: any) => s + (b.charges ?? 1), 0),
    }
  }

  const userStats = {
    total_qcm_perfect:   (profile as any)?.total_qcm_perfect   ?? 0,
    best_perfect_streak: (profile as any)?.best_perfect_streak  ?? 0,
    wheel_spins:         (profile as any)?.total_wheel_spins    ?? 0,
  }

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
