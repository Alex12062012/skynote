import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQcmQuestions } from '@/lib/ai/generate'

/**
 * POST /api/generate-qcm
 * Corps : { flashcardId: string }
 *
 * (Re)génère les questions QCM pour une fiche spécifique.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { flashcardId } = await request.json()
    if (!flashcardId) return NextResponse.json({ error: 'flashcardId manquant' }, { status: 400 })

    // Récupérer la fiche
    const { data: flashcard } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', flashcardId)
      .eq('user_id', user.id)
      .single()

    if (!flashcard) return NextResponse.json({ error: 'Fiche introuvable' }, { status: 404 })

    // Supprimer les anciens QCM de cette fiche
    await supabase.from('qcm_questions').delete().eq('flashcard_id', flashcardId)

    const keyPoints = Array.isArray(flashcard.key_points)
      ? flashcard.key_points
      : JSON.parse(String(flashcard.key_points) || '[]')

    // Régénérer
    const questions = await generateQcmQuestions(flashcard.title, flashcard.summary, keyPoints)

    const inserts = questions.map((q) => ({
      flashcard_id: flashcardId,
      course_id: flashcard.course_id,
      user_id: user.id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
    }))

    await supabase.from('qcm_questions').insert(inserts)

    return NextResponse.json({ message: 'QCM régénérés', count: inserts.length })
  } catch (error) {
    console.error('[API /generate-qcm]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
