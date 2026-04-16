import { createClient } from './server'

export type PlanType = 'free' | 'plus' | 'famille'

export interface PlanLimits {
  maxCoursesPerWeek: number
  vocalEnabled: boolean
  chatbotEnabled: boolean
  isPlus: boolean
  isFamille: boolean
  coinsForPlus: number
}

const FREE_LIMITS: PlanLimits = {
  maxCoursesPerWeek: 1,
  vocalEnabled: false,
  chatbotEnabled: false,
  isPlus: false,
  isFamille: false,
  coinsForPlus: 750,
}

const PLUS_LIMITS: PlanLimits = {
  maxCoursesPerWeek: -1,
  vocalEnabled: true,
  chatbotEnabled: true,
  isPlus: true,
  isFamille: false,
  coinsForPlus: 750,
}

const FAMILLE_LIMITS: PlanLimits = {
  maxCoursesPerWeek: -1,
  vocalEnabled: true,
  chatbotEnabled: true,
  isPlus: true,
  isFamille: true,
  coinsForPlus: 750,
}

export async function isBetaModeActive(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'beta_mode')
    .single()
  return data?.value === 'true'
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = await createClient()

  const betaActive = await isBetaModeActive()
  if (betaActive) return PLUS_LIMITS

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return FREE_LIMITS

  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
    await supabase.from('profiles').update({ plan: 'free', plan_expires_at: null }).eq('id', userId)
    return FREE_LIMITS
  }

  switch (profile.plan) {
    case 'plus':
      return PLUS_LIMITS
    case 'famille':
      return FAMILLE_LIMITS
    default:
      return FREE_LIMITS
  }
}

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

  if (!profile) return { allowed: false, coursesUsed: 0, coursesMax: 1, resetAt: null }

  const now = new Date()
  const lastReset = new Date(profile.week_reset_at)
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))

  let coursesThisWeek = profile.courses_this_week
  let weekResetAt = profile.week_reset_at

  if (daysSinceReset >= 7) {
    coursesThisWeek = 0
    weekResetAt = now.toISOString()
    await supabase
      .from('profiles')
      .update({ courses_this_week: 0, week_reset_at: weekResetAt })
      .eq('id', userId)
  }

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

  if (newCount === 3) {
    const loyaltyWeeks = (profile.total_loyalty_weeks || 0) + 1
    await supabase
      .from('profiles')
      .update({ total_loyalty_weeks: loyaltyWeeks })
      .eq('id', userId)

    if (loyaltyWeeks % 8 === 0) {
      await supabase.rpc('increment_coins', { p_user_id: userId, p_amount: 750 })

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: 750,
        reason: 'Fidelite - 8 semaines consecutives a 3 cours !',
      })
    }
  }
}
