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
    const daysSinceLastLogin = Math.floor(
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastLogin === 0) {
      // Déjà connecté aujourd'hui — ne pas changer le streak
      return
    } else if (daysSinceLastLogin === 1) {
      // Connexion le lendemain — incrémenter le streak
      newStreak = profile.streak_days + 1
    } else {
      // Streak brisé
      newStreak = 1
    }
  }

  await supabase
    .from('profiles')
    .update({ streak_days: newStreak, last_login_at: now.toISOString() })
    .eq('id', userId)

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

  if (isCompleted && !wasCompleted) {
    await awardCoins(userId, obj.reward_coins, `Objectif complété : ${obj.title} 🔥`)
  }
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

  await awardCoins(userId, obj.reward_coins, `Objectif complété : ${obj.title} 🎓`)
  revalidatePath('/objectives')
}

// ============================================================
// UTILITAIRE — Attribuer des coins
// ============================================================

export async function awardCoins(userId: string, amount: number, reason: string): Promise<void> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('sky_coins')
    .eq('id', userId)
    .single()

  if (!profile) return

  await supabase
    .from('profiles')
    .update({ sky_coins: profile.sky_coins + amount })
    .eq('id', userId)

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

  await supabase
    .from('profiles')
    .update({ sky_coins: profile.sky_coins - amount })
    .eq('id', userId)

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

  const PREMIUM_COST = 100

  const result = await spendCoins(user.id, PREMIUM_COST, '🌟 Activation Premium — 1 mois')
  if (!result.success) return result

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  await supabase
    .from('profiles')
    .update({ plan: 'premium', plan_expires_at: expiresAt.toISOString() })
    .eq('id', user.id)

  revalidatePath('/profile')
  revalidatePath('/objectives')
  return { success: true }
}
