import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fillQcmLevel } from '@/lib/ai/qcm-fill'
import { isQcmDifficulty } from '@/lib/ai/prompts'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * RECONCILIATEUR DE QCM — le moteur de la garantie de completude.
 *
 * Pourquoi il existe : tant que le seul declencheur est la requete de l'eleve,
 * un niveau peut rester incomplet pour des raisons qu'aucun reglage ne supprime
 * — la fonction est tuee a maxDuration (60 s sur Hobby), le modele peut rater
 * sa sortie un nombre non borne de fois, et surtout l'eleve peut fermer
 * l'onglet en pleine generation. 100 % ne s'obtient donc pas en agrandissant le
 * budget d'une requete, mais en relançant une operation idempotente jusqu'a
 * completude, depuis un moteur qui survit au navigateur.
 *
 * Ce moteur est pg_cron (migration 046), qui appelle cette route chaque minute.
 *
 * Surface d'attaque volontairement nulle cote entrees : la route ne prend
 * AUCUN parametre utilisateur. Elle choisit elle-meme son travail en base
 * (claim_qcm_fill_targets) et en deduit le user_id depuis la ligne du cours.
 * Le secret ne protege donc que contre le declenchement gratuit d'appels
 * Anthropic, il ne donne aucun pouvoir sur les donnees d'un utilisateur.
 */

/** Cibles traitees par passage. 3 x (3-4 fiches) tient largement dans 60 s. */
const TARGETS_PER_RUN = 3
const GENERATION_BUDGET_MS = 50_000

function unauthorized() {
  return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  const expected = process.env.QCM_RECONCILE_SECRET
  if (!expected) {
    console.error('[qcm/reconcile] QCM_RECONCILE_SECRET absent : route desactivee')
    return NextResponse.json({ error: 'Non configure' }, { status: 503 })
  }
  if (request.headers.get('x-reconcile-secret') !== expected) return unauthorized()

  try {
    const admin = createAdminClient()
    const { data: targets, error } = await admin.rpc('claim_qcm_fill_targets', {
      p_limit: TARGETS_PER_RUN,
    })
    if (error) throw new Error(`claim_qcm_fill_targets: ${error.message}`)

    const rows = (targets ?? []) as Array<{ course_id: string; user_id: string; difficulty: string }>
    if (rows.length === 0) {
      return NextResponse.json({ ok: true, targets: 0, durationMs: Date.now() - startedAt })
    }

    // Sequentiel : chaque cible lance deja un appel Claude par fiche en
    // parallele. Les empiler multiplierait la concurrence chez Anthropic sans
    // rien gagner, et c'est cette concurrence qui allongeait les latences.
    const results = []
    for (const t of rows) {
      if (Date.now() - startedAt > GENERATION_BUDGET_MS) break
      if (!isQcmDifficulty(t.difficulty)) continue

      const outcome = await fillQcmLevel({
        courseId: t.course_id,
        userId: t.user_id,
        difficulty: t.difficulty,
        deadline: startedAt + GENERATION_BUDGET_MS,
        // Pas de plafond 40/h ici : ce travail est a la charge de Skynote (le
        // cours a deja ete paye), et le nombre de tentatives est deja borne par
        // claim_qcm_fill_targets. Appliquer le plafond de l'eleve bloquerait la
        // reconciliation precisement pour celui qui en a le plus besoin.
      })

      if (outcome.complete) {
        await admin.rpc('reset_qcm_fill_attempts', {
          p_course_id: t.course_id,
          p_difficulty: t.difficulty,
        })
      }

      results.push({
        courseId: t.course_id,
        difficulty: t.difficulty,
        complete: outcome.complete,
        locked: outcome.locked ?? false,
        inserted: outcome.inserted,
        fiches: `${outcome.fichesFilled}/${outcome.fichesTotal}`,
        rounds: outcome.rounds,
      })
    }

    console.log('[qcm/reconcile]', JSON.stringify(results))
    return NextResponse.json({
      ok: true,
      targets: rows.length,
      results,
      durationMs: Date.now() - startedAt,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: 'qcm-reconcile' } })
    console.error('[qcm/reconcile]', err)
    return NextResponse.json({ error: String((err as Error)?.message ?? err) }, { status: 500 })
  }
}

/** Sonde de supervision : combien de couples (cours, niveau) restent incomplets. */
export async function GET(request: NextRequest) {
  const expected = process.env.QCM_RECONCILE_SECRET
  if (!expected || request.headers.get('x-reconcile-secret') !== expected) return unauthorized()

  const { data, error } = await createAdminClient().rpc('count_incomplete_qcm_levels')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, incomplete: data })
}
