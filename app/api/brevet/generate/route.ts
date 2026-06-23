import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { pickRandomQuestions } from '@/lib/brevet/questions-bank'
import type { StoredQuestion, RedactionSubject } from '@/lib/brevet/questions-bank'

export const maxDuration = 30

// Ce que l'on stocke en DB (pas de corrigé/critères)
export interface StoredSession {
  questions: StoredQuestion[]
  redaction: RedactionSubject
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

  // Piocher 17 questions ouvertes + 1 rédaction
  const { questions, redaction } = pickRandomQuestions()

  const admin = getAdminClient()
  const { error: updateErr } = await admin
    .from('exam_sessions')
    .update({
      questions,
      redaction,
      // 17 réponses texte + 1 réponse rédaction = 18 slots
      answers: new Array(questions.length + 1).fill(null),
    })
    .eq('id', sessionId)

  if (updateErr) {
    console.error('[brevet/generate] Erreur update:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: questions.length })
}
