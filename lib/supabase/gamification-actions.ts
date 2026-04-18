'use server'

import { createClient } from './server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import {
  BADGES, CONSUMABLES, TITLES, WHEEL_COST, WHEEL_SEGMENTS,
  type LeaderboardMode, LEADERBOARD_PAGE_SIZE, prestigeCost,
} from '@/lib/gamification/config'
import { computeReward, drawWheelSegment, type RewardBreakdown } from '@/lib/gamification/rewards'

// Service role client : nécessaire pour lire les profils d'autres joueurs (leaderboard, profil public)
function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── REWARD SAVE ─────────────────────────────────────────────────────────────
export interface SaveAttemptV2Input {
  flashcardId: string
  score: number
  total: number
  difficulty: 'peaceful' | 'easy' | 'medium' | 'hard'
}

export interface SaveAttemptV2Result {
  error: string | null
  reward: RewardBreakdown | null
}

/**
 * V2 : remplace saveQcmAttempt. Applique toutes les règles :
 * - coins par difficulté
 * - multiplicateur score (5/5=100%, 4/5=50%, <4=0)
 * - streak +5 / +15
 * - early game +5 sur les 10 premières 5/5
 * - multiplicateur prestige
 * - boost ×2 coins si actif
 */
export async function saveQcmAttemptV2(input: SaveAttemptV2Input): Promise<SaveAttemptV2Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté', reward: null }

  // 1. État du joueur
  const { data: profile } = await supabase
    .from('profiles')
    .select('prestige_level, perfect_streak, best_perfect_streak, total_qcm_perfect, total_qcm_attempted')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Profil introuvable', reward: null }

  // 2. Boost ×2 actif ?
  const { data: boost } = await supabase
    .from('user_boosts')
    .select('id, expires_at')
    .eq('user_id', user.id)
    .eq('boost_type', 'x2_coins')
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle()
  const hasX2Boost = Boolean(boost)

  // 3. Calcul
  const reward = computeReward({
    score: input.score,
    total: input.total,
    difficulty: input.difficulty,
    prestigeLevel:        profile.prestige_level        ?? 0,
    currentPerfectStreak: profile.perfect_streak        ?? 0,
    totalPerfectBefore:   profile.total_qcm_perfect     ?? 0,
    hasX2Boost,
  })

  // 4. Insert qcm_attempts
  const { error: errAttempt } = await supabase.from('qcm_attempts').insert({
    user_id: user.id,
    flashcard_id: input.flashcardId,
    score: input.score,
    total: input.total,
    perfect: reward.perfect,
    coins_earned: reward.total,
  })
  if (errAttempt) return { error: errAttempt.message, reward: null }

  // 5. Update stats & streak
  const nextBestStreak = Math.max(profile.best_perfect_streak ?? 0, reward.newPerfectStreak)
  await supabase.from('profiles').update({
    perfect_streak:      reward.newPerfectStreak,
    best_perfect_streak: nextBestStreak,
    total_qcm_attempted: (profile.total_qcm_attempted ?? 0) + 1,
    total_qcm_perfect:   (profile.total_qcm_perfect ?? 0) + (reward.perfect ? 1 : 0),
  }).eq('id', user.id)

  // 6. Award coins via RPC (atomique + transaction + weekly/monthly reset)
  if (reward.total > 0) {
    await supabase.rpc('award_coins', {
      p_user_id: user.id,
      p_amount: reward.total,
      p_reason: `QCM ${input.score}/${input.total}`,
    })
  }

  // 7. Marquer fiche comme maîtrisée si 5/5
  if (reward.perfect) {
    await supabase.from('flashcards')
      .update({ is_mastered: true })
      .eq('id', input.flashcardId)
      .eq('user_id', user.id)
  }

  // 8. Débloquer titres éventuels
  await unlockDerivedTitles(user.id)

  revalidatePath('/courses')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')

  return { error: null, reward }
}

// ─── PRESTIGE ────────────────────────────────────────────────────────────────
export async function doPrestige(): Promise<{ error: string | null; newPrestige?: number; cost?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }

  const { data, error } = await supabase.rpc('perform_prestige', { p_user_id: user.id })
  if (error) {
    if (error.message.includes('insufficient')) return { error: 'Pas assez de coins pour prestige' }
    return { error: error.message }
  }
  const row = Array.isArray(data) ? data[0] : data
  revalidatePath('/profile')
  revalidatePath('/leaderboard')
  revalidatePath('/boutique')
  return { error: null, newPrestige: row?.new_prestige, cost: row?.cost }
}

export async function getPrestigeInfo(): Promise<{ level: number; nextCost: number; currentCoins: number } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('prestige_level, sky_coins')
    .eq('id', user.id)
    .single()
  if (!data) return null

  return {
    level:        data.prestige_level ?? 0,
    nextCost:     prestigeCost(data.prestige_level ?? 0),
    currentCoins: data.sky_coins ?? 0,
  }
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
export interface LeaderboardRow {
  id: string
  pseudo: string | null
  user_number: number | null
  prestige_level: number
  active_title_id: string | null
  active_badge_id: string
  sky_coins: number              // solde actuel (peut avoir été dépensé)
  weekly_coins: number           // gagnés cette semaine
  monthly_coins: number          // gagnés ce mois-ci
  total_coins_earned: number     // lifetime — utilisé en mode all_time
  likes_received: number
  streak_days: number
  plan: string
}

export async function getLeaderboard(
  mode: LeaderboardMode = 'weekly',
  limit: number = LEADERBOARD_PAGE_SIZE,
): Promise<{ rows: LeaderboardRow[]; me: (LeaderboardRow & { rank: number }) | null }> {
  const admin = svc()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  // Colonne principale de tri :
  //  - weekly   → coins gagnés cette semaine
  //  - monthly  → coins gagnés ce mois-ci
  //  - all_time → SOLDE ACTUEL (sky_coins). Le classement all_time reflète
  //    "ce qu'il te reste", pas ce que tu as gagné dans ta vie. Cohérent avec
  //    /lexo (admin) qui affiche aussi le solde actuel.
  const orderCol =
    mode === 'weekly'  ? 'weekly_coins' :
    mode === 'monthly' ? 'monthly_coins' :
                          'sky_coins'

  // Tiebreakers déterministes : si plein de joueurs sont ex-aequo sur la
  // fenêtre courante (ex: semaine fraîche, tout le monde à 0), on les départage
  // par lifetime puis par user_number (ordre d'inscription). Ça évite que les
  // joueurs actifs soient noyés dans la masse des inactifs.
  const { data: rawTop } = await admin
    .from('profiles')
    .select('id, pseudo, user_number, prestige_level, active_title_id, active_badge_id, sky_coins, weekly_coins, monthly_coins, likes_received, streak_days, plan, role, classroom_id, total_coins_earned')
    .neq('role', 'teacher')
    .order(orderCol,              { ascending: false })
    .order('total_coins_earned',  { ascending: false })
    .order('user_number',         { ascending: true  })
    .limit(limit)

  const rows: LeaderboardRow[] = (rawTop ?? [])
    .slice(0, limit)
    .map((p: any) => ({
      id: p.id, pseudo: p.pseudo, user_number: p.user_number,
      prestige_level: p.prestige_level ?? 0,
      active_title_id: p.active_title_id, active_badge_id: p.active_badge_id ?? 'letter',
      sky_coins: p.sky_coins ?? 0, weekly_coins: p.weekly_coins ?? 0, monthly_coins: p.monthly_coins ?? 0,
      total_coins_earned: p.total_coins_earned ?? 0,
      likes_received: p.likes_received ?? 0, streak_days: p.streak_days ?? 0, plan: p.plan ?? 'free',
    }))

  let me: (LeaderboardRow & { rank: number }) | null = null
  if (user) {
    const idx = rows.findIndex(r => r.id === user.id)
    if (idx >= 0) {
      me = { ...rows[idx], rank: idx + 1 }
    } else {
      const { data: mp } = await admin
        .from('profiles')
        .select('id, pseudo, user_number, prestige_level, active_title_id, active_badge_id, sky_coins, weekly_coins, monthly_coins, likes_received, streak_days, plan, total_coins_earned')
        .eq('id', user.id)
        .single()
      if (mp) {
        // Pour le rang exact hors top, on compte les profils strictement au-dessus
        // avec le même tiebreaker que la liste (window > moi) OR (window = moi ET lifetime > moi)
        const col =
          mode === 'weekly'  ? 'weekly_coins' :
          mode === 'monthly' ? 'monthly_coins' :
                                'sky_coins'
        const myWindow   = (mp as any)[col] ?? 0
        const myLifetime = (mp as any).total_coins_earned ?? 0

        // Étage 1 : quelqu'un a plus que moi sur la fenêtre
        const { count: above1 } = await admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt(col, myWindow)
          .neq('role', 'teacher')

        // Étage 2 : égalité sur la fenêtre mais lifetime supérieur
        const { count: above2 } = await admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq(col, myWindow)
          .gt('total_coins_earned', myLifetime)
          .neq('role', 'teacher')

        me = {
          id: mp.id, pseudo: mp.pseudo, user_number: mp.user_number,
          prestige_level: mp.prestige_level ?? 0,
          active_title_id: mp.active_title_id, active_badge_id: mp.active_badge_id ?? 'letter',
          sky_coins: mp.sky_coins ?? 0, weekly_coins: mp.weekly_coins ?? 0, monthly_coins: mp.monthly_coins ?? 0,
          total_coins_earned: (mp as any).total_coins_earned ?? 0,
          likes_received: mp.likes_received ?? 0, streak_days: mp.streak_days ?? 0, plan: mp.plan ?? 'free',
          rank: (above1 ?? 0) + (above2 ?? 0) + 1,
        }
      }
    }
  }

  return { rows, me }
}

// ─── PROFIL PUBLIC ───────────────────────────────────────────────────────────
export interface PublicProfile {
  id: string
  pseudo: string | null
  user_number: number | null
  prestige_level: number
  active_title_id: string | null
  active_badge_id: string
  sky_coins: number
  likes_received: number
  bio: string | null
  streak_days: number
  stats: {
    qcm_attempted: number
    qcm_perfect: number
    success_rate: number
    total_coins_earned: number
    best_perfect_streak: number
  }
  unlocked_titles: string[]
  /** L'utilisateur courant a-t-il liké ce profil ? (null si pas connecté ou self) */
  viewer_liked: boolean | null
  is_self: boolean
}

export async function getPublicProfile(pseudo: string): Promise<PublicProfile | null> {
  const admin = svc()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const { data: p } = await admin
    .from('profiles')
    .select('id, pseudo, user_number, prestige_level, active_title_id, active_badge_id, sky_coins, likes_received, bio, streak_days, total_qcm_attempted, total_qcm_perfect, total_coins_earned, best_perfect_streak')
    .ilike('pseudo', pseudo)
    .maybeSingle()
  if (!p) return null

  const { data: titlesRaw } = await admin
    .from('user_titles').select('title_id').eq('user_id', p.id)
  const unlocked_titles = (titlesRaw ?? []).map((r: any) => r.title_id)

  let viewer_liked: boolean | null = null
  if (user && user.id !== p.id) {
    const { data: liked } = await admin
      .from('profile_likes')
      .select('id')
      .eq('liker_id', user.id).eq('liked_id', p.id)
      .maybeSingle()
    viewer_liked = Boolean(liked)
  }

  const attempted = p.total_qcm_attempted ?? 0
  const perfect   = p.total_qcm_perfect ?? 0
  return {
    id: p.id,
    pseudo: p.pseudo,
    user_number: p.user_number,
    prestige_level: p.prestige_level ?? 0,
    active_title_id: p.active_title_id,
    active_badge_id: p.active_badge_id ?? 'letter',
    sky_coins: p.sky_coins ?? 0,
    likes_received: p.likes_received ?? 0,
    bio: p.bio,
    streak_days: p.streak_days ?? 0,
    stats: {
      qcm_attempted: attempted,
      qcm_perfect: perfect,
      success_rate: attempted > 0 ? Math.round((perfect / attempted) * 100) : 0,
      total_coins_earned: p.total_coins_earned ?? 0,
      best_perfect_streak: p.best_perfect_streak ?? 0,
    },
    unlocked_titles,
    viewer_liked,
    is_self: user?.id === p.id,
  }
}

export async function toggleLike(likedId: string): Promise<{ error: string | null; liked: boolean | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté', liked: null }
  if (user.id === likedId) return { error: 'Impossible de se liker soi-même', liked: null }

  const { data, error } = await supabase.rpc('toggle_like', { p_liked_id: likedId })
  if (error) return { error: error.message, liked: null }
  revalidatePath('/leaderboard')
  return { error: null, liked: Boolean(data) }
}

// ─── SHOP : badges, titres, consommables ─────────────────────────────────────
type ShopCategory = 'badge' | 'title' | 'consumable'

export async function buyItem(
  category: ShopCategory,
  itemId: string,
): Promise<{ error: string | null; newBalance?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }

  // Trouver le prix dans le catalogue
  let price = 0
  if (category === 'badge') {
    const b = BADGES.find(x => x.id === itemId)
    if (!b || b.price <= 0) return { error: 'Badge introuvable' }
    price = b.price
  } else if (category === 'title') {
    const t = TITLES.find(x => x.id === itemId)
    if (!t?.price) return { error: 'Titre introuvable ou non achetable' }
    price = t.price
  } else {
    const c = CONSUMABLES.find(x => x.id === itemId)
    if (!c) return { error: 'Consommable introuvable' }
    price = c.price
  }

  // Check déjà possédé (badges & titres)
  if (category === 'badge') {
    const { data: owned } = await supabase
      .from('user_badges').select('id')
      .eq('user_id', user.id).eq('badge_id', itemId).maybeSingle()
    if (owned) return { error: 'Déjà débloqué' }
  }
  if (category === 'title') {
    const { data: owned } = await supabase
      .from('user_titles').select('id')
      .eq('user_id', user.id).eq('title_id', itemId).maybeSingle()
    if (owned) return { error: 'Déjà débloqué' }
  }

  // ─── Débit : tente RPC atomique, fallback manuel si migration 016 non appliquée
  let newBalance: number | undefined
  const { data: spent, error: errSpend } = await supabase.rpc('spend_coins', {
    p_user_id: user.id, p_amount: price,
    p_reason: `Boutique: ${category} ${itemId}`,
  })

  if (errSpend) {
    if (errSpend.message?.includes('insufficient')) return { error: 'Coins insuffisants' }

    // Fallback manuel (RPC absente = migration pas poussée)
    const { data: profile } = await supabase
      .from('profiles').select('sky_coins').eq('id', user.id).single()
    if (!profile) return { error: 'Profil introuvable' }
    if ((profile.sky_coins ?? 0) < price) return { error: 'Coins insuffisants' }

    const { error: upErr } = await supabase
      .from('profiles').update({ sky_coins: profile.sky_coins - price }).eq('id', user.id)
    if (upErr) return { error: `Débit impossible : ${upErr.message}` }

    await supabase.from('coin_transactions').insert({
      user_id: user.id, amount: -price, reason: `Boutique: ${category} ${itemId}`,
    })
    newBalance = profile.sky_coins - price
  } else {
    newBalance = typeof spent === 'number' ? spent : undefined
  }

  // ─── Crédit de l'item (avec rollback si échec)
  const rollback = async () => {
    // remet les coins
    const { data: p } = await supabase.from('profiles').select('sky_coins').eq('id', user.id).single()
    if (p) await supabase.from('profiles').update({ sky_coins: (p.sky_coins ?? 0) + price }).eq('id', user.id)
    await supabase.from('coin_transactions').insert({
      user_id: user.id, amount: price, reason: `Rollback: ${category} ${itemId}`,
    })
  }

  let grantErr: string | null = null
  if (category === 'badge') {
    const { error } = await supabase.from('user_badges').insert({
      user_id: user.id, badge_id: itemId, source: 'purchase',
    })
    if (error) grantErr = error.code === '23505' ? 'Déjà débloqué'
               : error.message?.includes('does not exist') ? 'Migration 016 non appliquée — lance `npx supabase db push`'
               : error.message
  } else if (category === 'title') {
    const { error } = await supabase.from('user_titles').insert({
      user_id: user.id, title_id: itemId, source: 'purchase',
    })
    if (error) grantErr = error.code === '23505' ? 'Déjà débloqué'
               : error.message?.includes('does not exist') ? 'Migration 016 non appliquée — lance `npx supabase db push`'
               : error.message
  } else {
    const c = CONSUMABLES.find(x => x.id === itemId)!
    const expires = c.durationHours > 0
      ? new Date(Date.now() + c.durationHours * 3600 * 1000).toISOString()
      : null
    const { error } = await supabase.from('user_boosts').insert({
      user_id: user.id, boost_type: itemId, expires_at: expires, charges: 1,
    })
    if (error) grantErr = error.message?.includes('does not exist')
               ? 'Migration 016 non appliquée — lance `npx supabase db push`'
               : error.message
  }

  if (grantErr) {
    await rollback()
    return { error: grantErr }
  }

  revalidatePath('/boutique')
  revalidatePath('/profile')
  return { error: null, newBalance }
}

export async function equip(kind: 'badge' | 'title', itemId: string | null): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }

  if (itemId) {
    // vérifier possession
    if (kind === 'badge' && itemId !== 'letter') {
      const { data: owned } = await supabase
        .from('user_badges').select('id')
        .eq('user_id', user.id).eq('badge_id', itemId).maybeSingle()
      if (!owned) return { error: 'Badge non débloqué' }
    }
    if (kind === 'title') {
      const { data: owned } = await supabase
        .from('user_titles').select('id')
        .eq('user_id', user.id).eq('title_id', itemId).maybeSingle()
      if (!owned) return { error: 'Titre non débloqué' }
    }
  }

  await supabase.from('profiles').update({
    [kind === 'badge' ? 'active_badge_id' : 'active_title_id']: itemId,
  }).eq('id', user.id)

  revalidatePath('/profile')
  revalidatePath('/leaderboard')
  return { error: null }
}

// ─── WHEEL OF FORTUNE ────────────────────────────────────────────────────────
export interface WheelSpinResult {
  segmentIndex: number
  segmentId: string
  label: string
  netGain: number
  newBalance: number
}

/**
 * Tirage côté server (anti-triche) avec probabilités config.
 * EV ≈ -26 coins → l'économie est protégée.
 */
export async function spinWheel(): Promise<{ error: string | null; result: WheelSpinResult | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté', result: null }

  // Débiter le ticket
  const { data: afterDebit, error: errDebit } = await supabase.rpc('spend_coins', {
    p_user_id: user.id, p_amount: WHEEL_COST, p_reason: 'Tour de roue',
  })
  if (errDebit) {
    if (errDebit.message.includes('insufficient')) return { error: 'Coins insuffisants', result: null }
    return { error: errDebit.message, result: null }
  }

  // Tirage pondéré
  const draw = drawWheelSegment(WHEEL_SEGMENTS)
  const seg = draw.segment
  let newBalance = typeof afterDebit === 'number' ? afterDebit : 0
  let reward = 0

  if (seg.type === 'coins' && seg.value > 0) {
    reward = seg.value
    const { data: awarded } = await supabase.rpc('award_coins', {
      p_user_id: user.id, p_amount: seg.value, p_reason: `Roue ${seg.label}`,
    })
    if (typeof awarded === 'number') newBalance = awarded
  }

  // Historique
  await supabase.from('wheel_spins').insert({
    user_id: user.id,
    segment_id: seg.id,
    reward_type: seg.type,
    reward_value: reward,
    cost: WHEEL_COST,
    net_gain: reward - WHEEL_COST,
  })

  revalidatePath('/boutique')
  return {
    error: null,
    result: {
      segmentIndex: draw.index,
      segmentId: seg.id,
      label: seg.label,
      netGain: reward - WHEEL_COST,
      newBalance,
    },
  }
}

// ─── TITRES AUTO-DÉBLOQUÉS ───────────────────────────────────────────────────
async function unlockDerivedTitles(userId: string) {
  const admin = svc()
  const { data: p } = await admin
    .from('profiles')
    .select('total_qcm_perfect, best_perfect_streak')
    .eq('id', userId).single()
  if (!p) return

  const unlocks: string[] = []
  if ((p.total_qcm_perfect ?? 0) >= 50)  unlocks.push('machine_5_5')
  if ((p.total_qcm_perfect ?? 0) >= 100) unlocks.push('qcm_100')
  if ((p.total_qcm_perfect ?? 0) >= 500) unlocks.push('qcm_500')
  if ((p.best_perfect_streak ?? 0) >= 10) unlocks.push('intouchable')

  // Pro du casino
  const { count: spins } = await admin
    .from('wheel_spins').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  if ((spins ?? 0) >= 50) unlocks.push('pro_casino')

  for (const titleId of unlocks) {
    await admin.from('user_titles').insert({
      user_id: userId, title_id: titleId, source: 'unlock',
    }).select()  // ignore les conflits via upsert-like (l'unique key bloquera les doublons)
      .then(() => {}, () => {})
  }
}

// ─── INVENTAIRE (pour /profile) ──────────────────────────────────────────────
export async function getMyInventory(): Promise<{
  badges: string[]
  titles: string[]
  activeBadge: string
  activeTitle: string | null
  activeBoosts: Array<{ boost_type: string; expires_at: string | null }>
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: badges }, { data: titles }, { data: boosts }] = await Promise.all([
    supabase.from('profiles').select('active_badge_id, active_title_id').eq('id', user.id).single(),
    supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    supabase.from('user_titles').select('title_id').eq('user_id', user.id),
    supabase.from('user_boosts').select('boost_type, expires_at').eq('user_id', user.id)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString()),
  ])

  return {
    badges:      (badges ?? []).map((b: any) => b.badge_id).concat(['letter']),  // letter gratuit toujours dispo
    titles:      (titles ?? []).map((t: any) => t.title_id),
    activeBadge: profile?.active_badge_id ?? 'letter',
    activeTitle: profile?.active_title_id ?? null,
    activeBoosts: (boosts ?? []) as any,
  }
}
