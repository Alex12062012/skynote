import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
  // Génération QCM : plafond horaire + journalier sur CHAQUE appel (génération
  // initiale comprise), indépendant des Novas. Borne l'exposition Anthropic à
  // ~1,8 $/jour/utilisateur quoi qu'il fasse (RLS « for all » sur qcm_questions :
  // un utilisateur peut vider ses lignes en console et rappeler la route).
  // 40/h = 2 cours de 6 fiches par heure en mode « par fiche », 13 en « par niveau ».
  generateQcmHour: { limit: 40,  windowMs: 60 * 60 * 1000 },      // 40/heure
  generateQcmDay:  { limit: 200, windowMs: 24 * 60 * 60 * 1000 }, // 200/jour
} as const

/**
 * Applique les deux plafonds de génération QCM. Renvoie la réponse 429 à
 * retourner telle quelle si l'un des deux est atteint, sinon null.
 */
export async function checkQcmRateLimits(userId: string): Promise<Response | null> {
  for (const [key, cfg, libelle] of [
    ['generate-qcm-hour', RATE_LIMITS.generateQcmHour, '40 générations de QCM par heure'],
    ['generate-qcm-day',  RATE_LIMITS.generateQcmDay,  '200 générations de QCM par jour'],
  ] as const) {
    const rl = await checkRateLimit(userId, key, cfg)
    if (!rl.allowed) {
      const minutes = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 60_000))
      return NextResponse.json(
        { error: `Limite atteinte : ${libelle}. Réessaie dans ${minutes} min.`, code: 'rate_limited', resetAt: rl.resetAt },
        { status: 429, headers: { 'X-RateLimit-Reset': String(rl.resetAt), 'Retry-After': String(minutes * 60) } }
      )
    }
  }
  return null
}
