import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { addNovasForUser, NOVA_COST_EXAM_SIMULATION } from '@/lib/supabase/nova-actions'

export interface ExamQuestion {
  matiere: string
  question: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
}

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  // Verifier que la session appartient a l'utilisateur et est en cours de generation
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('id, status, questions')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  // Si questions déjà remplies, la génération est déjà faite
  if (Array.isArray(session.questions) && (session.questions as any[]).length > 0) return NextResponse.json({ ok: true })

  // Recupere les cours ready
  const { data: courses } = await supabase
    .from('courses')
    .select('id, subject')
    .eq('user_id', user.id)
    .eq('status', 'ready')

  if (!courses || courses.length === 0) {
    await supabase.from('exam_sessions').delete().eq('id', sessionId)
    await addNovasForUser(user.id, NOVA_COST_EXAM_SIMULATION, 'Remboursement — pas de cours')
    return NextResponse.json({ error: 'Pas de cours disponible' }, { status: 422 })
  }

  const courseIds = courses.map(c => c.id)
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('title, summary, course_id')
    .in('course_id', courseIds)
    .not('summary', 'is', null)
    .not('summary', 'eq', '')
    .limit(120)

  if (!flashcards || flashcards.length < 5) {
    await supabase.from('exam_sessions').delete().eq('id', sessionId)
    await addNovasForUser(user.id, NOVA_COST_EXAM_SIMULATION, 'Remboursement — pas assez de fiches')
    return NextResponse.json({ error: 'Pas assez de fiches' }, { status: 422 })
  }

  const subjectMap = Object.fromEntries(courses.map(c => [c.id, c.subject ?? 'General']))
  const cardContent = flashcards
    .slice(0, 80)
    .map(f => `[${subjectMap[f.course_id] ?? 'General'}] ${f.title}: ${f.summary}`)
    .join('\n')

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Tu es un concepteur d'examens pour le brevet des colleges francais (niveau 3e).

A partir des fiches de revision suivantes d'un eleve, genere exactement 20 questions QCM a 4 choix, dans le style du brevet (claires, precises, niveau college).

FICHES DE L'ELEVE :
${cardContent}

CONSIGNES :
- 20 questions au total, reparties equitablement entre les matieres presentes dans les fiches
- Chaque question a exactement 4 options (A, B, C, D), une seule correcte
- Les questions testent la comprehension, pas juste la memorisation de mots
- Niveau brevet 3e : ni trop simple ni trop difficile
- Le champ "matiere" doit correspondre a la matiere de la fiche (ex: "Mathematiques", "Histoire-Geographie", "SVT", "Physique-Chimie", "Francais"...)

Reponds UNIQUEMENT avec un tableau JSON valide, sans markdown ni texte autour :
[
  {
    "matiere": "Mathematiques",
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": 0
  }
]

"correct" est l'index 0-3 de la bonne reponse dans le tableau "options".`,
      }],
    })

    const raw = (msg.content[0] as any).text.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Format JSON invalide')

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed) || parsed.length < 10) throw new Error('Trop peu de questions')

    const questions = parsed.slice(0, 20)

    await supabase
      .from('exam_sessions')
      .update({
        questions,
        answers: new Array(questions.length).fill(null),
      })
      .eq('id', sessionId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    await supabase.from('exam_sessions').delete().eq('id', sessionId)
    await addNovasForUser(user.id, NOVA_COST_EXAM_SIMULATION, 'Remboursement — erreur generation')
    console.error('[brevet/generate] Erreur:', err)
    return NextResponse.json({ error: 'La generation a echoue. Reessaie.' }, { status: 500 })
  }
}
