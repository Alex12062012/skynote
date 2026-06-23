import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { addNovasForUser, NOVA_COST_EXAM_SIMULATION } from '@/lib/supabase/nova-actions'
import { waitUntil } from '@vercel/functions'

export const maxDuration = 60

export interface ExamQuestion {
  matiere: string
  question: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
}

const anthropic = new Anthropic()

// Client service role — bypass RLS pour les updates dans waitUntil
function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function callClaude(cardContent: string, target: number): Promise<ExamQuestion[]> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Tu es un concepteur d'examens pour le brevet des colleges francais (niveau 3e).

A partir des fiches suivantes, genere exactement ${target} questions QCM a 4 choix, style brevet.

FICHES :
${cardContent}

CONSIGNES :
- ${target} questions, reparties entre les matieres presentes
- 4 options (A, B, C, D), une seule correcte
- Niveau brevet 3e
- Champ "matiere" = la matiere de la fiche (ex: "Mathematiques", "Histoire-Geographie", "SVT"...)

Reponds UNIQUEMENT avec un tableau JSON valide, sans markdown :
[{"matiere":"...","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0}]`,
    }],
  })

  const raw = (msg.content[0] as any).text.trim()
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Format JSON invalide')
  const parsed = JSON.parse(jsonMatch[0])
  if (!Array.isArray(parsed) || parsed.length < Math.floor(target * 0.7)) {
    throw new Error(`Trop peu de questions : ${parsed.length}`)
  }
  return parsed.slice(0, target) as ExamQuestion[]
}

async function generateQuestions(sessionId: string, userId: string): Promise<void> {
  // Service role pour toutes les requetes — pas de dependance aux cookies auth
  const admin = getAdminClient()

  const { data: courses } = await admin
    .from('courses')
    .select('id, subject')
    .eq('user_id', userId)
    .eq('status', 'ready')

  if (!courses || courses.length === 0) {
    await admin.from('exam_sessions').delete().eq('id', sessionId)
    await addNovasForUser(userId, NOVA_COST_EXAM_SIMULATION, 'Remboursement — pas de cours')
    return
  }

  const courseIds = courses.map((c: any) => c.id)
  const { data: flashcards } = await admin
    .from('flashcards')
    .select('title, summary, course_id')
    .in('course_id', courseIds)
    .not('summary', 'is', null)
    .not('summary', 'eq', '')
    .limit(120)

  if (!flashcards || flashcards.length < 5) {
    await admin.from('exam_sessions').delete().eq('id', sessionId)
    await addNovasForUser(userId, NOVA_COST_EXAM_SIMULATION, 'Remboursement — pas assez de fiches')
    return
  }

  const subjectMap = Object.fromEntries(courses.map((c: any) => [c.id, c.subject ?? 'General']))
  const cards = (flashcards as any[]).slice(0, 80).map(
    (f: any) => `[${subjectMap[f.course_id] ?? 'General'}] ${f.title}: ${f.summary}`
  )

  const mid = Math.ceil(cards.length / 2)
  const results = await Promise.allSettled([
    callClaude(cards.slice(0, mid).join('\n'), 10),
    callClaude(cards.slice(mid).join('\n'), 10),
  ])

  const questions = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

  if (questions.length < 5) {
    throw new Error(`Generation partielle insuffisante : ${questions.length} questions`)
  }

  const { error: updateErr } = await admin
    .from('exam_sessions')
    .update({ questions, answers: new Array(questions.length).fill(null) })
    .eq('id', sessionId)

  if (updateErr) {
    console.error('[brevet/generate] Erreur update session:', updateErr)
    throw updateErr
  }
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

  const { data: session } = await supabase
    .from('exam_sessions')
    .select('id, questions')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  if (Array.isArray(session.questions) && (session.questions as any[]).length > 0) {
    return NextResponse.json({ ok: true })
  }

  const userId = user.id
  const admin = getAdminClient()

  waitUntil(
    generateQuestions(sessionId, userId).catch(async (err) => {
      const errMsg = err?.message ?? String(err)
      console.error('[brevet/generate] Erreur generation:', errMsg)
      // Stocker l'erreur exacte dans answers pour que le client puisse l'afficher
      await admin.from('exam_sessions').update({
        answers: [{ _error: errMsg }]
      }).eq('id', sessionId)
      await addNovasForUser(userId, NOVA_COST_EXAM_SIMULATION, 'Remboursement — erreur generation')
    })
  )

  return NextResponse.json({ ok: true, message: 'Generation lancee' }, { status: 202 })
}
