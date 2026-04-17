import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQcmQuestions } from '@/lib/ai/generate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const body = await request.json()
    const { flashcardId, regenerate, difficulty = 'medium' } = body

    const { data: flashcard } = await supabase
      .from('flashcards')
      .select('id, title, summary, key_points, course_id, user_id')
      .eq('id', flashcardId)
      .eq('user_id', user.id)
      .single()

    if (!flashcard) return NextResponse.json({ error: 'Fiche introuvable' }, { status: 404 })

    if (regenerate) {
      // Supprimer uniquement les questions pour ce niveau
      await supabase
        .from('qcm_questions')
        .delete()
        .eq('flashcard_id', flashcardId)
        .eq('difficulty', difficulty)
    } else {
      // Verifier si les QCM existent deja pour ce niveau specifique
      const { count } = await supabase
        .from('qcm_questions')
        .select('id', { count: 'exact' })
        .eq('flashcard_id', flashcardId)
        .eq('difficulty', difficulty)

      if ((count ?? 0) > 0) {
        return NextResponse.json({ ok: true, skipped: true })
      }
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
      console.error('[generate-qcm] Zero questions generated', { flashcardId, difficulty })
      return NextResponse.json(
        { error: "Aucune question générée par l'IA" },
        { status: 500 }
      )
    }

    const { error: insertError } = await supabase.from('qcm_questions').insert(
      questions.map((q) => ({
        flashcard_id: flashcard.id,
        course_id: flashcard.course_id,
        user_id: user.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        difficulty,
      }))
    )

    if (insertError) {
      console.error('[generate-qcm] Supabase insert failed:', insertError)
      return NextResponse.json(
        { error: `Insert DB: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, inserted: questions.length })
  } catch (error: any) {
    console.error('[generate-qcm] Error:', error)
    return NextResponse.json({ error: error.message || 'Erreur inconnue' }, { status: 500 })
  }
}
