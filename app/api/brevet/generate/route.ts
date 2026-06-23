import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { pickRandomQuestions } from '@/lib/brevet/questions-bank'

export const maxDuration = 30

export interface ExamQuestion {
  matiere: string
  question: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
}

// Client service role — bypass RLS
function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!sessionId || !uuidRegex.test(sessionId)) {
    return NextResponse.json({ error: 'sessionId invalide' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  // Verifier que la session appartient a l'utilisateur
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('id, questions')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })

  // Deja generee
  if (Array.isArray(session.questions) && (session.questions as any[]).length > 0) {
    return NextResponse.json({ ok: true })
  }

  // Piocher 20 questions dans la banque (instantane, pas de Claude)
  const questions = pickRandomQuestions(20)

  const admin = getAdminClient()
  const { error: updateErr } = await admin
    .from('exam_sessions')
    .update({
      questions,
      answers: new Array(questions.length).fill(null),
    })
    .eq('id', sessionId)

  if (updateErr) {
    console.error('[brevet/generate] Erreur update:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: questions.length })
}
