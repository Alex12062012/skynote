import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ExamQuestion } from '../start/route'

// Calcule la mention à partir du score (%)
function getMention(score: number): string {
  if (score >= 80) return 'tres_bien'
  if (score >= 70) return 'bien'
  if (score >= 60) return 'assez_bien'
  if (score >= 50) return 'passable'
  return 'insuffisant'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { sessionId, answers } = await req.json() as { sessionId: string; answers: (number | null)[] }

  if (!sessionId || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Vérifier que la session appartient bien à l'utilisateur et est encore en cours
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('id, questions, status, plan_snapshot')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  if (session.status === 'completed') return NextResponse.json({ error: 'Session déjà soumise' }, { status: 409 })

  const questions = session.questions as ExamQuestion[]

  // Calcul du score côté serveur (les bonnes réponses ne sont jamais envoyées au client)
  let correct = 0
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correct) correct++
  }
  const score = Math.round((correct / questions.length) * 100)
  const mention = getMention(score)

  // Mise à jour de la session
  await supabase
    .from('exam_sessions')
    .update({ answers, score, mention, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId)

  // Les résultats détaillés (par question) ne sont renvoyés qu'aux plans payants
  const isPaid = session.plan_snapshot === 'starter' || session.plan_snapshot === 'pro'

  return NextResponse.json({
    score: isPaid ? score : null,           // null = bloqué pour Free
    mention: isPaid ? mention : null,
    correct: isPaid ? correct : null,
    total: questions.length,
    locked: !isPaid,
  })
}
