import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAllQcmQuestions } from '@/lib/ai/generate'
import { isQcmDifficulty } from '@/lib/ai/prompts'
import { Errors, apiError } from '@/lib/errors'
import { checkQcmRateLimits } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Génération initiale d'UN niveau pour TOUTES les fiches d'un cours, en un
 * seul appel Claude (au lieu d'un appel par fiche × niveau : 18 → 3 appels
 * pour un cours à 6 fiches). Appelée 3 fois en parallèle par QcmGenerator,
 * un niveau qui échoue n'affecte pas les deux autres.
 *
 * Gratuit : couvert par les Novas du cours. Ne touche jamais aux fiches qui
 * ont déjà des questions à ce niveau (la régénération payante reste sur
 * /api/generate-qcm, par fiche).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw Errors.unauthorized()

    const body = await request.json().catch(() => null)
    const courseId = String(body?.courseId ?? '')
    const difficulty = body?.difficulty
    if (!/^[0-9a-f-]{36}$/i.test(courseId)) throw Errors.badRequest('courseId invalide')
    if (!isQcmDifficulty(difficulty)) throw Errors.badRequest('difficulty invalide')

    // Plafonds 40/h + 200/jour : 1 appel = 1 unité, quel que soit le nombre de fiches.
    const limited = await checkQcmRateLimits(user.id)
    if (limited) return limited

    const { data: course } = await supabase
      .from('courses')
      .select('id, user_id')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()
    if (!course) throw Errors.notFound('Cours')

    const [{ data: flashcards }, { data: existing }] = await Promise.all([
      supabase
        .from('flashcards')
        .select('id, title, summary, key_points')
        .eq('course_id', courseId)
        .order('order_index'),
      supabase
        .from('qcm_questions')
        .select('flashcard_id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .eq('difficulty', difficulty),
    ])

    const alreadyDone = new Set((existing ?? []).map((q) => q.flashcard_id))
    const missing = (flashcards ?? []).filter((f) => !alreadyDone.has(f.id))
    if (missing.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, inserted: 0 })
    }

    const inputs = missing.map((f) => ({
      title: f.title,
      summary: f.summary,
      key_points: Array.isArray(f.key_points)
        ? f.key_points
        : (() => { try { return JSON.parse(String(f.key_points || '[]')) } catch { return [] } })(),
    }))

    // Un seul appel Claude pour toutes les fiches manquantes (retry interne
    // par fiche invalide, erreur explicite si un lot reste inutilisable).
    const byTitle = await generateAllQcmQuestions(inputs, difficulty)

    const rows = missing.flatMap((f) =>
      (byTitle.get(f.title) ?? []).map((q) => ({
        flashcard_id: f.id,
        course_id: courseId,
        user_id: user.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        difficulty,
      }))
    )
    if (rows.length === 0) throw Errors.internal("Aucune question générée par l'IA")

    // Ecriture via service role : qcm_questions est en lecture seule cote client.
    const { error: insertError } = await createAdminClient().from('qcm_questions').insert(rows)
    if (insertError) throw Errors.internal(`Insert DB: ${insertError.message}`)

    const fichesCovered = new Set(rows.map((r) => r.flashcard_id)).size
    return NextResponse.json({
      ok: true,
      inserted: rows.length,
      fiches: fichesCovered,
      fichesMissing: missing.length - fichesCovered,
    })
  } catch (error: unknown) {
    return apiError(error)
  }
}
