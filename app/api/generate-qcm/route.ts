import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQcmQuestions } from '@/lib/ai/generate'
import { NOVA_COST_QCM_SINGLE, deductNovasForUser, addNovasForUser } from '@/lib/supabase/nova-actions'
import { Errors, apiError } from '@/lib/errors'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  let novaDeducted = false
  let userId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw Errors.unauthorized()
    userId = user.id
    if (!rateLimit(`generate-qcm:${user.id}`, 20, 60_000)) return rateLimitResponse()

    const body = await request.json()
    const { flashcardId, regenerate, difficulty = 'medium' } = body

    const { data: flashcard } = await supabase
      .from('flashcards')
      .select('id, title, summary, key_points, course_id, user_id')
      .eq('id', flashcardId)
      .eq('user_id', user.id)
      .single()

    if (!flashcard) throw Errors.notFound('Fiche')

    if (!regenerate) {
      // Vérifier si les QCM existent déjà pour ce niveau
      const { count } = await supabase
        .from('qcm_questions')
        .select('id', { count: 'exact' })
        .eq('flashcard_id', flashcardId)
        .eq('difficulty', difficulty)

      if ((count ?? 0) > 0) {
        return NextResponse.json({ ok: true, skipped: true })
      }
    }

    // Déduire les Novas AVANT l'appel IA (seulement si régénération ou nouvelle génération)
    const deductResult = await deductNovasForUser(
      user.id,
      NOVA_COST_QCM_SINGLE,
      `QCM regénéré — ${flashcard.title} (${difficulty})`
    )
    if (!deductResult.ok) {
      return NextResponse.json(
        { error: deductResult.error ?? 'Novas insuffisantes', code: 'insufficient_novas' },
        { status: 402 }
      )
    }
    novaDeducted = true

    if (regenerate) {
      // Supprimer les questions existantes pour ce niveau
      await supabase
        .from('qcm_questions')
        .delete()
        .eq('flashcard_id', flashcardId)
        .eq('difficulty', difficulty)
    }

    const keyPoints = Array.isArray(flashcard.key_points)
      ? flashcard.key_points
      : JSON.parse(String(flashcard.key_points) || '[]')

    const questions = await generateQcmQuestions(
      flashcard.title,
      flashcard.summary,
      keyPoints,
      difficulty
    )

    if (!questions || questions.length === 0) {
      throw Errors.internal("Aucune question générée par l'IA")
    }

    const { error: insertError } = await supabase.from('qcm_questions').insert(
      questions.map((q) => ({
        flashcard_id: flashcard.id,
        course_id:    flashcard.course_id,
        user_id:      user.id,
        question:     q.question,
        options:      q.options,
        correct_index: q.correct_index,
        explanation:  q.explanation,
        difficulty,
      }))
    )

    if (insertError) {
      throw Errors.internal(`Insert DB: ${insertError.message}`)
    }

    return NextResponse.json({ ok: true, inserted: questions.length, novaBalance: deductResult.balance })
  } catch (error: unknown) {
    if (novaDeducted && userId) {
      await addNovasForUser(userId, NOVA_COST_QCM_SINGLE, 'Remboursement QCM échoué').catch(() => {})
    }
    return apiError(error)
  }
}
