import { createClient } from './server'

export type PlanType = 'free' | 'starter' | 'pro'

// Cache module-level — persiste entre les invocations chaudes (TTL 60s)
let betaCache: { value: boolean; expiresAt: number } | null = null

export interface PlanLimits {
  vocalEnabled:   boolean
  chatbotEnabled: boolean
  isStarter:      boolean
  isPro:          boolean
  /** Novas allouées par mois (ou one-time pour free) */
  novasPerMonth:  number
}

const FREE_LIMITS: PlanLimits = {
  vocalEnabled:   false,
  chatbotEnabled: false,
  isStarter:      false,
  isPro:          false,
  novasPerMonth:  600,
}

const STARTER_LIMITS: PlanLimits = {
  vocalEnabled:   true,
  chatbotEnabled: true,
  isStarter:      true,
  isPro:          false,
  novasPerMonth:  2000,
}

const PRO_LIMITS: PlanLimits = {
  vocalEnabled:   true,
  chatbotEnabled: true,
  isStarter:      true,
  isPro:          true,
  novasPerMonth:  4000,
}

export async function isBetaModeActive(): Promise<boolean> {
  const now = Date.now()
  if (betaCache && now < betaCache.expiresAt) return betaCache.value

  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'beta_mode')
    .single()
  const value = data?.value === 'true'
  betaCache = { value, expiresAt: now + 60_000 }
  return value
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = await createClient()

  const betaActive = await isBetaModeActive()
  if (betaActive) return PRO_LIMITS

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return FREE_LIMITS

  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
    await supabase
      .from('profiles')
      .update({ plan: 'free', plan_expires_at: null })
      .eq('id', userId)
    return FREE_LIMITS
  }

  switch (profile.plan) {
    case 'starter': return STARTER_LIMITS
    case 'pro':     return PRO_LIMITS
    default:        return FREE_LIMITS
  }
}

/** Indique si l'utilisateur a accès aux fonctionnalités premium */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const limits = await getUserPlanLimits(userId)
  return limits.isStarter
}

// ─── FONCTIONS LEGACY (gardées pour compatibilité avec le reste du code) ─────

export async function canCreateCourse(userId: string): Promise<{
  allowed: boolean
  coursesUsed: number
  coursesMax: number
  resetAt: string | null
}> {
  // Avec le système Nova, la limite n'est plus par cours/semaine mais par novas.
  // On laisse toujours passer ici ; la vérification se fait au moment de la déduction.
  return { allowed: true, coursesUsed: 0, coursesMax: -1, resetAt: null }
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
