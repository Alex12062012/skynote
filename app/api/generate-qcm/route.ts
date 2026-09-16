import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQcmQuestions } from '@/lib/ai/generate'
import { isQcmDifficulty } from '@/lib/ai/prompts'
import { NOVA_COST_QCM_SINGLE, deductNovasForUser, addNovasForUser } from '@/lib/supabase/nova-actions'
import { Errors, apiError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  let novaDeducted = false
  let userId: string | null = null
  let novaBalance: number | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw Errors.unauthorized()
    userId = user.id

    const body = await request.json()
    const { flashcardId, difficulty = 'medium' } = body
    if (!isQcmDifficulty(difficulty)) throw Errors.badRequest('difficulty invalide')

    const { data: flashcard } = await supabase
      .from('flashcards')
      .select('id, title, summary, key_points, course_id, user_id')
      .eq('id', flashcardId)
      .eq('user_id', user.id)
      .single()

    if (!flashcard) throw Errors.notFound('Fiche')

    const { count } = await supabase
      .from('qcm_questions')
      .select('id', { count: 'exact' })
      .eq('flashcard_id', flashcardId)
      .eq('difficulty', difficulty)
    const hasExisting = (count ?? 0) > 0

    if (!body.regenerate && hasExisting) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Facturation : les 118✦ du cours couvrent TOUS les QCM. Un niveau vide
    // (jamais genere, ou echec initial a la charge de Skynote) se genere donc
    // gratuitement. Les 4✦ ne sont deduits que pour REMPLACER des questions
    // existantes — c'est aussi le seul cas soumis au rate limit, puisque la
    // generation initiale enchaine fiches × niveaux appels d'un coup.
    const isPaidRegeneration = hasExisting

    if (isPaidRegeneration) {
      const rl = await checkRateLimit(user.id, 'generate-qcm', RATE_LIMITS.generateQcm)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Limite atteinte : 20 régénérations de QCM par jour. Réessaie demain.' },
          { status: 429, headers: { 'X-RateLimit-Reset': String(rl.resetAt) } }
        )
      }

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
      novaBalance = deductResult.balance
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

    if (isPaidRegeneration) {
      // On ne supprime l'ancien jeu qu'une fois le nouveau genere : un echec IA
      // ne doit jamais laisser le niveau vide.
      await supabase
        .from('qcm_questions')
        .delete()
        .eq('flashcard_id', flashcardId)
        .eq('difficulty', difficulty)
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

    return NextResponse.json({ ok: true, inserted: questions.length, novaBalance })
  } catch (error: unknown) {
    if (novaDeducted && userId) {
      await addNovasForUser(userId, NOVA_COST_QCM_SINGLE, 'Remboursement QCM échoué').catch(() => {})
    }
    return apiError(error)
  }
}
