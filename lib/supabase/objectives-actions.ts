'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

// ============================================================
// STREAK — Mise à jour du streak de connexion
// ============================================================

export async function updateLoginStreak(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_days, last_login_at, sky_coins')
    .eq('id', userId)
    .single()

  if (!profile) return

  const now = new Date()
  const lastLogin = profile.last_login_at ? new Date(profile.last_login_at) : null

  let newStreak = profile.streak_days

  if (!lastLogin) {
    newStreak = 1
  } else {
    // Comparaison par DATE CALENDAIRE (pas par ms écoulées).
    // Corrige le bug : login à 23h50 puis 00h05 le lendemain = 0 ms écoulées
    // mais bien 1 jour calendaire de différence → streak devait s'incrémenter.
    const nowMidnight  = new Date(now.getFullYear(),       now.getMonth(),       now.getDate())
    const lastMidnight = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate())
    const daysDiff = Math.round(
      (nowMidnight.getTime() - lastMidnight.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff === 0) {
      // Déjà connecté aujourd'hui — ne pas changer le streak
      return
    } else if (daysDiff === 1) {
      // Connexion le lendemain exact — incrémenter le streak
      newStreak = profile.streak_days + 1
    } else {
      // Gap > 1 jour : streak brisé, on repart de 1
      newStreak = 1
    }
  }

  await supabase
    .from('profiles')
    .update({ streak_days: newStreak, last_login_at: now.toISOString() })
    .eq('id', userId)

  // Bonus 3 coins pour 3 jours consécutifs
  if (newStreak === 3) {
    await supabase.rpc('award_coins', {
      p_user_id: userId,
      p_amount: 3,
      p_reason: '3 jours de suite !',
    })
  }

  // Vérifier objectif streak_7
  await checkStreakObjective(userId, newStreak)
}

// ============================================================
// VÉRIFICATION OBJECTIF STREAK
// ============================================================

async function checkStreakObjective(userId: string, currentStreak: number): Promise<void> {
  const supabase = await createClient()

  const { data: obj } = await supabase
    .from('objectives')
    .select('*')
    .eq('key', 'streak_7')
    .single()

  if (!obj) return

  const { data: userObj } = await supabase
    .from('user_objectives')
    .select('*')
    .eq('user_id', userId)
    .eq('objective_id', obj.id)
    .single()

  const isCompleted = currentStreak >= obj.target_value
  const wasCompleted = userObj?.completed ?? false

  if (userObj) {
    await supabase
      .from('user_objectives')
      .update({
        current_value: currentStreak,
        completed: isCompleted,
        completed_at: isCompleted && !wasCompleted ? new Date().toISOString() : userObj.completed_at,
      })
      .eq('id', userObj.id)
  } else {
    await supabase.from('user_objectives').insert({
      user_id: userId,
      objective_id: obj.id,
      current_value: currentStreak,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
  }

  // Ne pas créditer ici — les coins sont versés uniquement via claimObjectiveReward
}

// ============================================================
// OBJECTIF MAÎTRISE TOTALE
// ============================================================

export async function checkMasteryObjective(courseId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('is_mastered')
    .eq('course_id', courseId)
    .eq('user_id', userId)

  if (!flashcards || flashcards.length === 0) return

  const allMastered = flashcards.every((f) => f.is_mastered)
  if (!allMastered) return

  const { data: obj } = await supabase
    .from('objectives')
    .select('*')
    .eq('key', 'mastery_all')
    .single()

  if (!obj) return

  const { data: userObj } = await supabase
    .from('user_objectives')
    .select('*')
    .eq('user_id', userId)
    .eq('objective_id', obj.id)
    .maybeSingle()

  if (userObj?.completed) return // déjà récompensé

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

  // Ne pas créditer ici — les coins sont versés uniquement via claimObjectiveReward
  revalidatePath('/objectives')
}

// ============================================================
// UTILITAIRE — Attribuer des coins
// ============================================================

export async function awardCoins(userId: string, amount: number, reason: string): Promise<void> {
  const supabase = await createClient()

  // Increment atomique pour eviter les race conditions
  await supabase.rpc('increment_coins', { p_user_id: userId, p_amount: amount })

  await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount,
    reason,
  })
}

// ============================================================
// DÉPENSER DES COINS (ex. débloquer Premium)
// ============================================================

export async function spendCoins(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('sky_coins')
    .eq('id', userId)
    .single()

  if (!profile) return { success: false, error: 'Profil introuvable' }
  if (profile.sky_coins < amount) return { success: false, error: 'Coins insuffisants' }

  // Decrement atomique
  await supabase.rpc('increment_coins', { p_user_id: userId, p_amount: -amount })

  await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount: -amount,
    reason,
  })

  revalidatePath('/objectives')
  revalidatePath('/profile')
  return { success: true }
}

// ============================================================
// ACTIVER PREMIUM AVEC DES COINS
// ============================================================

export async function activatePremiumWithCoins(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non connecté' }

  const PREMIUM_COST = 750

  const result = await spendCoins(user.id, PREMIUM_COST, 'Activation Plus — 1 mois')
  if (!result.success) return result

  // Si l'utilisateur a déjà un plan Plus actif → prolonger au lieu de reset
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .single()

  const now = new Date()
  let baseDate = now

  if (
    profile?.plan === 'starter' &&
    profile?.plan_expires_at &&
    new Date(profile.plan_expires_at) > now
  ) {
    // Prolonger la base de calcul pour les utilisateurs Starter actifs
    baseDate = new Date(profile.plan_expires_at!)
  }

  const expiresAt = new Date(baseDate)
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ plan: 'starter', plan_expires_at: expiresAt.toISOString() })
    .eq('id', user.id)

  if (updateError) return { success: false, error: updateError.message }

  return { success: true }
}
