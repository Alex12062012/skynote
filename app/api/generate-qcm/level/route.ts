import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAllQcmQuestions, type GeneratedQuestion } from '@/lib/ai/generate'
import { isQcmDifficulty } from '@/lib/ai/prompts'
import { Errors, apiError } from '@/lib/errors'
import { checkQcmRateLimits } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Génération initiale d'UN niveau pour TOUTES les fiches d'un cours en une
 * requête HTTP : un appel Claude par fiche, tous en parallèle (voir la mesure
 * plus bas pour la raison). Appelée 3 fois en parallèle par QcmGenerator, un
 * niveau qui échoue n'affecte pas les deux autres.
 *
 * Gratuit : couvert par les Novas du cours. Ne touche jamais aux fiches qui
 * ont déjà des questions à ce niveau (la régénération payante reste sur
 * /api/generate-qcm, par fiche).
 */
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

    // Plafonds 40/h + 200/jour : une unité par fiche (= par appel Claude).
    const limited = await checkQcmRateLimits(user.id, missing.length)
    if (limited) return limited

    const inputs = missing.map((f) => ({
      title: f.title,
      summary: f.summary,
      key_points: Array.isArray(f.key_points)
        ? f.key_points
        : (() => { try { return JSON.parse(String(f.key_points || '[]')) } catch { return [] } })(),
    }))

    // Mesure en prod (plan Hobby, maxDuration 60 s, sortie ≈ 125 tokens/s) :
    // 6 fiches en UN appel = 36 s en Paisible, > 60 s en Normal/Hardcore (504) ;
    // 3 fiches par appel = 35-43 s sans place pour le retry. Seul un appel PAR
    // FICHE (≈ 2 300 tokens, ≈ 20 s) laisse la marge d'un retry sous 60 s. Les
    // appels sont lances en parallele : la latence du niveau reste ≈ 20-40 s.
    // Le retry est saute passe un budget de temps : un lot partiel vaut mieux
    // qu'un timeout, les fiches manquantes restent regenerables gratuitement.
    const retryDeadline = startedAt + 30_000
    const settled = await Promise.allSettled(
      inputs.map((fiche) => generateAllQcmQuestions([fiche], difficulty, { retryDeadline }))
    )
    const byTitle = new Map<string, GeneratedQuestion[]>()
    for (const r of settled) {
      if (r.status === 'fulfilled') r.value.forEach((qs, title) => byTitle.set(title, qs))
      else console.error('[generate-qcm/level]', difficulty, r.reason)
    }

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
      durationMs: Date.now() - startedAt,
    })
  } catch (error: unknown) {
    return apiError(error)
  }
}
