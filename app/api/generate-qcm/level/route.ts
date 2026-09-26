import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fillQcmLevel } from '@/lib/ai/qcm-fill'
import { isQcmDifficulty } from '@/lib/ai/prompts'
import { Errors, apiError } from '@/lib/errors'
import { checkQcmRateLimits } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Remplissage d'UN niveau de QCM pour toutes les fiches d'un cours, declenche
 * par l'eleve (QcmGenerator appelle les 3 niveaux en parallele).
 *
 * Gratuit : couvert par les Novas du cours. La logique vit dans fillQcmLevel,
 * partagee avec le reconciliateur serveur (/api/qcm/reconcile) — c'est lui qui
 * garantit la completude si cette requete-ci n'y arrive pas, ou si l'eleve
 * ferme l'onglet.
 */

/**
 * Budget laisse a la generation. maxDuration est a 60 s : on garde ~8 s pour
 * l'auth, les lectures, l'insertion du dernier tour et la reponse.
 */
const GENERATION_BUDGET_MS = 52_000

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw Errors.unauthorized()

    const body = await request.json().catch(() => null)
    const courseId = String(body?.courseId ?? '')
    const difficulty = body?.difficulty
    if (!/^[0-9a-f-]{36}$/i.test(courseId)) throw Errors.badRequest('courseId invalide')
    if (!isQcmDifficulty(difficulty)) throw Errors.badRequest('difficulty invalide')

    const { data: course } = await supabase
      .from('courses')
      .select('id, user_id')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()
    if (!course) throw Errors.notFound('Cours')

    let rateLimited: Response | null = null
    const outcome = await fillQcmLevel({
      courseId,
      userId: user.id,
      difficulty,
      deadline: startedAt + GENERATION_BUDGET_MS,
      // Plafonds 40/h + 200/jour : une unite par fiche (= par appel Claude).
      // Verifie a chaque tour, pas seulement au premier : un retry coute aussi.
      consumeRateLimit: async (units) => {
        rateLimited = await checkQcmRateLimits(user.id, units)
        return rateLimited !== null
      },
    })

    // Le plafond n'a bloque qu'apres avoir deja rempli des fiches : on renvoie
    // le progres plutot qu'un 429 sec, l'eleve a quand meme gagne du terrain.
    if (rateLimited && outcome.inserted === 0) return rateLimited

    return NextResponse.json({
      ok: true,
      locked: outcome.locked ?? false,
      complete: outcome.complete,
      inserted: outcome.inserted,
      fiches: outcome.fichesFilled,
      fichesTotal: outcome.fichesTotal,
      fichesMissing: Math.max(0, outcome.fichesTotal - outcome.fichesFilled),
      rounds: outcome.rounds,
      durationMs: Date.now() - startedAt,
    })
  } catch (error: unknown) {
    return apiError(error)
  }
}
