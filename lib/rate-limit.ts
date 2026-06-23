import { createClient } from '@supabase/supabase-js'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number  // timestamp ms
}

// Service role : contourne RLS, pas de dépendance aux cookies de la requête
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function checkRateLimit(
  userId: string,
  endpoint: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const windowSeconds = Math.floor(windowMs / 1000)

  const { data, error } = await getClient().rpc('check_and_increment_rate_limit', {
    p_user_id:        userId,
    p_endpoint:       endpoint,
    p_limit:          limit,
    p_window_seconds: windowSeconds,
  })

  if (error || !data) {
    // En cas d'erreur DB, on laisse passer plutôt que de bloquer l'utilisateur
    console.error('[rate-limit] RPC error:', error?.message)
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs }
  }

  const resetAt = new Date(data.reset_at as string).getTime()
  const remaining = Math.max(0, limit - (data.count as number))

  return {
    allowed:   data.allowed as boolean,
    remaining,
    resetAt,
  }
}

export const RATE_LIMITS = {
  chat:         { limit: 20, windowMs: 60 * 60 * 1000 },        // 20/heure
  generateFree: { limit: 5,  windowMs: 24 * 60 * 60 * 1000 },   // 5/jour (free)
  generatePaid: { limit: 10, windowMs: 24 * 60 * 60 * 1000 },   // 10/jour (premium)
  extractPhoto: { limit: 10, windowMs: 24 * 60 * 60 * 1000 },   // 10/jour
  generateQcm:  { limit: 20, windowMs: 24 * 60 * 60 * 1000 },   // 20/jour
} as const
