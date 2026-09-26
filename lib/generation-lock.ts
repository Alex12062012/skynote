import { createClient } from '@supabase/supabase-js'

/**
 * Verrou atomique (bail) autour des générations IA.
 *
 * Pourquoi : les gardes « est-ce que ça existe déjà en base ? » des routes de
 * génération sont des read-then-write. Deux requêtes concurrentes du même
 * utilisateur lisent toutes les deux « rien », puis écrivent toutes les deux —
 * d'où les 8 fiches au lieu de 4 et les 10 questions au lieu de 5 relevés en
 * prod (2 instructions INSERT distinctes, jamais une seule qui déborde).
 *
 * Le seul remède fiable est un verrou en base : un INSERT .. ON CONFLICT dans
 * Postgres est atomique, contrairement à une lecture suivie d'une écriture
 * depuis deux instances de fonction Vercel. Même approche que la migration 039
 * pour le rate limit.
 *
 * C'est un BAIL, pas un verrou permanent : au-delà du TTL il se reprend seul,
 * pour qu'un timeout Vercel (60 s) ne bloque pas le cours définitivement.
 */

// Service role : la table generation_locks n'a aucune policy RLS (serveur only)
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** maxDuration est à 60 s sur les routes concernées : 120 s laisse la marge. */
const DEFAULT_TTL_SECONDS = 120

export const lockKeys = {
  flashcards: (courseId: string) => `course:${courseId}:flashcards`,
  qcmLevel: (courseId: string, difficulty: string) => `course:${courseId}:qcm:${difficulty}`,
  qcmSingle: (flashcardId: string, difficulty: string) => `fiche:${flashcardId}:qcm:${difficulty}`,
}

/**
 * true = le bail est à nous, on peut générer et insérer.
 * false = une autre requête est déjà dessus, il faut s'arrêter là.
 *
 * Contrairement au rate limit, une erreur DB ne « laisse pas passer » : passer
 * outre, c'est précisément recréer le doublon. On refuse, l'utilisateur peut
 * relancer (le bail expire de lui-même).
 */
export async function acquireGenerationLock(
  lockKey: string,
  userId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<boolean> {
  const { data, error } = await getClient().rpc('try_acquire_generation_lock', {
    p_lock_key:    lockKey,
    p_user_id:     userId,
    p_ttl_seconds: ttlSeconds,
  })

  if (error) {
    console.error('[generation-lock] acquire failed:', lockKey, error.message)
    return false
  }
  return data === true
}

/** Libère le bail. Best-effort : s'il échoue, le TTL s'en charge. */
export async function releaseGenerationLock(lockKey: string): Promise<void> {
  const { error } = await getClient().rpc('release_generation_lock', { p_lock_key: lockKey })
  if (error) console.error('[generation-lock] release failed:', lockKey, error.message)
}
