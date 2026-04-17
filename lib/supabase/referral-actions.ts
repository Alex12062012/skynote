'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

// ============================================================
// GÉNÉRER UN CODE DE PARRAINAGE
// ============================================================

export async function generateReferralCode(userId: string): Promise<string> {
  const supabase = await createClient()

  // Vérifier si l'utilisateur a déjà un code
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (profile?.referral_code) return profile.referral_code

  // Générer un code unique SKY-XXXXXX
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'SKY-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  // Vérifier l'unicité
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle()

  if (existing) {
    // Réessayer si collision (rare)
    return generateReferralCode(userId)
  }

  await supabase.from('profiles').update({ referral_code: code }).eq('id', userId)
  return code
}

// ============================================================
// APPLIQUER UN CODE DE PARRAINAGE À L'INSCRIPTION
// ============================================================

export async function applyReferralCode(
  newUserId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const normalizedCode = code.trim().toUpperCase()

  // Trouver le parrain
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id, sky_coins')
    .eq('referral_code', normalizedCode)
    .single()

  if (!referrer) return { success: false, error: 'Code invalide ou inexistant' }
  if (referrer.id === newUserId) return { success: false, error: 'Tu ne peux pas utiliser ton propre code' }

  // Vérifier que le nouvel utilisateur n'a pas déjà utilisé un code
  const { data: newUser } = await supabase
    .from('profiles')
    .select('referred_by, sky_coins')
    .eq('id', newUserId)
    .single()

  if (newUser?.referred_by) return { success: false, error: 'Tu as déjà utilisé un code de parrainage' }

  const REWARD = 15

  // Attribuer les coins au parrain (increment atomique)
  await supabase.rpc('increment_coins', { p_user_id: referrer.id, p_amount: REWARD })

  await supabase.from('coin_transactions').insert({
    user_id: referrer.id,
    amount: REWARD,
    reason: `Parrainage réussi ! Un ami a rejoint Skynote 🤝`,
  })

  // Attribuer les coins au filleul + noter le parrain (increment atomique)
  await supabase.rpc('increment_coins', { p_user_id: newUserId, p_amount: REWARD })
  await supabase
    .from('profiles')
    .update({ referred_by: referrer.id })
    .eq('id', newUserId)

  await supabase.from('coin_transactions').insert({
    user_id: newUserId,
    amount: REWARD,
    reason: `Bonus de bienvenue — code parrainage utilisé 🎁`,
  })

  // Vérifier objectif parrainage pour le parrain
  await checkReferralObjective(referrer.id)

  revalidatePath('/objectives')
  revalidatePath('/profile')
  return { success: true }
}

// ============================================================
// VÉRIFIER OBJECTIF PARRAINAGE
// ============================================================

async function checkReferralObjective(userId: string) {
  const supabase = await createClient()

  const { data: obj } = await supabase
    .from('objectives')
    .select('*')
    .eq('key', 'share_friend')
    .single()

  if (!obj) return

  const { data: userObj } = await supabase
    .from('user_objectives')
    .select('*')
    .eq('user_id', userId)
    .eq('objective_id', obj.id)
    .maybeSingle()

  if (userObj?.completed) return

  if (userObj) {
    await supabase
      .from('user_objectives')
      .update({ current_value: 1, completed: true, completed_at: new Date().toISOString() })
      .eq('id', userObj.id)
  } else {
    await supabase.from('user_objectives').insert({
      user_id: userId,
      objective_id: obj.id,
      current_value: 1,
      completed: true,
      completed_at: new Date().toISOString(),
    })
  }
}

// ============================================================
// OBTENIR LES STATS DE PARRAINAGE
// ============================================================

export async function getReferralStats(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  // Compter les filleuls
  const { count: referralsCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('referred_by', userId)

  return {
    code: profile?.referral_code ?? null,
    referralsCount: referralsCount ?? 0,
  }
}
