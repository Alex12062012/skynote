import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getFullQuestion, getRedactionById } from '@/lib/brevet/questions-bank'
import type { StoredQuestion, RedactionSubject } from '@/lib/brevet/questions-bank'

export const maxDuration = 60 // Hobby = max 60s ; Pro = jusqu'a 300s

const anthropic = new Anthropic({ timeout: 20_000 }) // 20s par appel

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getMention(pointsSur20: number): string {
  if (pointsSur20 >= 16) return 'tres_bien'
  if (pointsSur20 >= 14) return 'bien'
  if (pointsSur20 >= 12) return 'assez_bien'
  if (pointsSur20 >= 10) return 'passable'
  return 'insuffisant'
}

async function correctOpenQuestion(
  question: string,
  corrige: string,
  criteres: string[],
  reponseEleve: string,
): Promise<{ points: number; feedback: string }> {
  const prompt = `Tu es correcteur du brevet des colleges (DNB). Temperature=0. Note de facon rigoureuse et equitable.

QUESTION : ${question}

CORRIGE DE REFERENCE : ${corrige}

CRITERES BINAIRES (chaque critere vaut ${(1 / criteres.length).toFixed(4)} point) :
${criteres.map((c, i) => `${i + 1}. ${c}`).join('\n')}

REPONSE DE L'ELEVE : ${reponseEleve || '(aucune reponse)'}

CONSIGNE : Evalue chaque critere binaire (oui/non). La reponse n'a pas besoin d'etre parfaitement redigee, evalue le fond.

Reponds UNIQUEMENT en JSON valide, sans markdown :
{"criteres_valides": [true, false], "points": 0.5, "feedback": "Courte explication (1-2 phrases)"}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (response.content[0] as { text: string }).text
    const json = JSON.parse(text)
    return {
      points: Math.min(1, Math.max(0, Number(json.points) || 0)),
      feedback: json.feedback || '',
    }
  } catch {
    return { points: 0, feedback: 'Correction indisponible.' }
  }
}

async function correctRedaction(
  sujet: RedactionSubject,
  reponseEleve: string,
): Promise<{ points: number; feedback: string }> {
  const prompt = `Tu es correcteur de redaction au brevet des colleges (DNB). Note sur 3 points.

TYPE : ${sujet.type === 'imagination' ? "Sujet d'imagination" : 'Sujet de reflexion'}
CONSIGNE : ${sujet.consigne}

GRILLE DE NOTATION (3 pts) :
- Comprehension et respect du sujet (1 pt)
- Qualite de l'argumentation ou de la narration (1 pt)
- Expression et qualite de la langue (1 pt)

REPONSE DE L'ELEVE : ${reponseEleve || '(aucune reponse)'}

Reponds UNIQUEMENT en JSON valide, sans markdown :
{"points_sujet": 0.5, "points_argumentation": 1, "points_expression": 0.5, "points": 2, "feedback": "Feedback (2-3 phrases)"}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (response.content[0] as { text: string }).text
    const json = JSON.parse(text)
    return {
      points: Math.min(3, Math.max(0, Number(json.points) || 0)),
      feedback: json.feedback || '',
    }
  } catch {
    return { points: 0, feedback: 'Correction indisponible.' }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const { sessionId, answers } = await req.json() as {
    sessionId: string
    answers: (string | null)[]
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!sessionId || !uuidRegex.test(sessionId) || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 })
  }

  const { data: session } = await supabase
    .from('exam_sessions')
    .select('id, questions, redaction, status, plan_snapshot')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  if (session.status === 'completed') return NextResponse.json({ error: 'Session deja soumise' }, { status: 409 })

  const questions = session.questions as StoredQuestion[]
  const redactionSubject = session.redaction as RedactionSubject | null

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "L'epreuve n'est pas encore prete." }, { status: 409 })
  }

  // Correction en parallele : 17 questions ouvertes + 1 redaction
  const [openCorrections, redactionResult] = await Promise.all([
    Promise.all(
      questions.map(async (q, i) => {
        const full = getFullQuestion(q.id)
        if (!full) return { points: 0, feedback: 'Question introuvable.' }
        return correctOpenQuestion(full.question, full.corrige, full.criteres, answers[i] ?? '')
      })
    ),
    redactionSubject
      ? correctRedaction(
          getRedactionById(redactionSubject.id) ?? redactionSubject,
          answers[questions.length] ?? ''
        )
      : Promise.resolve({ points: 0, feedback: '' }),
  ])

  // Score : 17 x 1 pt + redaction x 3 pts = 20 pts
  const pointsOuvertes = openCorrections.reduce((s, c) => s + c.points, 0)
  const totalSur20 = Math.round((pointsOuvertes + redactionResult.points) * 10) / 10
  const mention = getMention(totalSur20)
  const score = Math.round((totalSur20 / 20) * 100)

  const corrections = [
    ...openCorrections.map((c, i) => ({
      questionId: questions[i].id,
      matiere: questions[i].matiere,
      points: c.points,
      feedback: c.feedback,
    })),
    {
      questionId: redactionSubject?.id ?? 'redaction',
      matiere: 'Francais — Redaction',
      points: redactionResult.points,
      feedback: redactionResult.feedback,
    },
  ]

  const admin = getAdminClient()
  await admin
    .from('exam_sessions')
    .update({
      answers,
      score,
      mention,
      corrections,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  const isPaid = ['starter', 'pro', 'plus', 'famille'].includes(session.plan_snapshot ?? '')

  return NextResponse.json({
    score: isPaid ? score : null,
    mention: isPaid ? mention : null,
    totalSur20: isPaid ? totalSur20 : null,
    corrections: isPaid ? corrections : null,
    total: questions.length + 1,
    locked: !isPaid,
  })
}
