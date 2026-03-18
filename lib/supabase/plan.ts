import { createClient } from './server'

export type PlanType = 'free' | 'plus' | 'famille'

export interface PlanLimits {
  maxCoursesPerWeek: number // -1 = illimité
  vocalEnabled: boolean
  isPlus: boolean
  isFamille: boolean
  coinsForPlus: number
}

const FREE_LIMITS: PlanLimits = {
  maxCoursesPerWeek: 3,
  vocalEnabled: false,
  isPlus: false,
  isFamille: false,
  coinsForPlus: 750,
}

const PLUS_LIMITS: PlanLimits = {
  maxCoursesPerWeek: -1,
  vocalEnabled: true,
  isPlus: true,
  isFamille: false,
  coinsForPlus: 750,
}

const FAMILLE_LIMITS: PlanLimits = {
  maxCoursesPerWeek: -1,
  vocalEnabled: true,
  isPlus: true,
  isFamille: true,
  coinsForPlus: 750,
}

/**
 * Vérifie si le mode bêta est actif (tout le monde = Plus)
 */
export async function isBetaModeActive(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'beta_mode')
    .single()
  return data?.value === 'true'
}

/**
 * Récupère les limites du plan d'un utilisateur
 * Si beta mode actif → tout le monde a les limites Plus
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = await createClient()

  // Vérifier beta mode
  const betaActive = await isBetaModeActive()
  if (betaActive) return PLUS_LIMITS

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return FREE_LIMITS

  // Vérifier expiration
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
    // Plan expiré → free
    await supabase.from('profiles').update({ plan: 'free', plan_expires_at: null }).eq('id', userId)
    return FREE_LIMITS
  }

  switch (profile.plan) {
    case 'plus':
    case 'premium': // compat
      return PLUS_LIMITS
    case 'famille':
      return FAMILLE_LIMITS
    default:
      return FREE_LIMITS
  }
}

/**
 * Vérifie si l'utilisateur peut créer un nouveau cours cette semaine
 */
export async function canCreateCourse(userId: string): Promise<{
  allowed: boolean
  coursesUsed: number
  coursesMax: number
  resetAt: string | null
}> {
  const limits = await getUserPlanLimits(userId)

  if (limits.maxCoursesPerWeek === -1) {
    return { allowed: true, coursesUsed: 0, coursesMax: -1, resetAt: null }
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('courses_this_week, week_reset_at')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, coursesUsed: 0, coursesMax: 3, resetAt: null }

  // Vérifier si on doit reset (lundi)
  const now = new Date()
  const lastReset = new Date(profile.week_reset_at)
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))

  let coursesThisWeek = profile.courses_this_week
  let weekResetAt = profile.week_reset_at

  if (daysSinceReset >= 7) {
    // Reset le compteur
    coursesThisWeek = 0
    weekResetAt = now.toISOString()
    await supabase
      .from('profiles')
      .update({ courses_this_week: 0, week_reset_at: weekResetAt })
      .eq('id', userId)
  }

  // Calculer le prochain lundi
  const nextMonday = new Date()
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
  nextMonday.setHours(0, 0, 0, 0)

  return {
    allowed: coursesThisWeek < limits.maxCoursesPerWeek,
    coursesUsed: coursesThisWeek,
    coursesMax: limits.maxCoursesPerWeek,
    resetAt: nextMonday.toISOString(),
  }
}

/**
 * Incrémenter le compteur de cours de la semaine
 */
export async function incrementWeeklyCourseCount(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('courses_this_week, total_loyalty_weeks, week_reset_at')
    .eq('id', userId)
    .single()

  if (!profile) return

  const newCount = (profile.courses_this_week || 0) + 1
  await supabase
    .from('profiles')
    .update({ courses_this_week: newCount })
    .eq('id', userId)

  // Vérifier fidélité : 3 cours cette semaine → incrémenter les semaines loyales
  if (newCount >= 3) {
    const loyaltyWeeks = (profile.total_loyalty_weeks || 0) + 1
    await supabase
      .from('profiles')
      .update({ total_loyalty_weeks: loyaltyWeeks })
      .eq('id', userId)

    // Récompense : 8 semaines consécutives = +750 coins
    if (loyaltyWeeks % 8 === 0) {
      const { data: profileFull } = await supabase
        .from('profiles')
        .select('sky_coins')
        .eq('id', userId)
        .single()

      if (profileFull) {
        await supabase
          .from('profiles')
          .update({ sky_coins: profileFull.sky_coins + 750 })
          .eq('id', userId)

        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: 750,
          reason: '🏆 Fidélité — 8 semaines consécutives à 3 cours !',
        })
      }
    }
  }
}
