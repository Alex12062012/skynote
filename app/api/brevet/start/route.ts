import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  deductNovas,
  addNovasForUser,
  NOVA_COST_EXAM_SIMULATION,
  EXAM_SIMULATION_FREE_MAX,
  EXAM_SIMULATION_STARTER_MAX,
  EXAM_SIMULATION_PRO_SOFT_CAP,
} from '@/lib/supabase/nova-actions'
import { getUserPlanLimits } from '@/lib/supabase/plan'

const anthropic = new Anthropic()

export interface ExamQuestion {
  matiere: string
  question: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
}

// ─── Quota Starter : 1 épreuve à vie ─────────────────────────────────────────

async function getTotalCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('exam_sessions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)

  return count ?? 0
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Plan de l'utilisateur
  const limits = await getUserPlanLimits(user.id)
  const planSnapshot = limits.isPro ? 'pro' : limits.isStarter ? 'starter' : 'free'

  // ── Vérification du quota selon le plan ──────────────────────────────────────
  const sessionCount = await getTotalCount(supabase, user.id)

  if (limits.isPro) {
    // Pro : cap doux à 10 à vie — message "serveurs surchargés" (pas un vrai blocage)
    if (sessionCount >= EXAM_SIMULATION_PRO_SOFT_CAP) {
      return NextResponse.json(
        {
          error: 'Nos serveurs sont temporairement surchargés pour les simulations de brevet. Réessaie dans quelques heures.',
          code: 'server_overloaded',
        },
        { status: 503 }
      )
    }
  } else if (limits.isStarter) {
    // Starter : 1 session à vie (résultat visible)
    if (sessionCount >= EXAM_SIMULATION_STARTER_MAX) {
      return NextResponse.json(
        {
          error: 'Tu as déjà utilisé ta simulation brevet Starter. Passe en Pro pour des épreuves illimitées.',
          code: 'quota_exceeded',
        },
        { status: 402 }
      )
    }
  } else {
    // Gratuit : 1 session à vie (résultat verrouillé)
    if (sessionCount >= EXAM_SIMULATION_FREE_MAX) {
      return NextResponse.json(
        {
          error: 'Tu as déjà utilisé ta simulation brevet gratuite. Passe en Starter pour débloquer tes résultats et recommencer.',
          code: 'quota_exceeded',
        },
        { status: 402 }
      )
    }
  }

  // Déduction Novas — deductNovas() utilise directement le cookie auth
  const deductResult = await deductNovas(NOVA_COST_EXAM_SIMULATION, 'Épreuve brevet simulée')
  if (!deductResult.ok) {
    return NextResponse.json(
      { error: `Il te faut ${NOVA_COST_EXAM_SIMULATION} ✦ pour lancer une épreuve.`, code: 'insufficient_novas' },
      { status: 402 }
    )
  }

  // Récupère les cours de l'utilisateur pour obtenir les IDs
  const { data: courses } = await supabase
    .from('courses')
    .select('id, subject')
    .eq('user_id', user.id)
    .eq('status', 'ready')

  if (!courses || courses.length === 0) {
    await addNovasForUser(user.id, NOVA_COST_EXAM_SIMULATION, 'Remboursement — pas de cours')
    return NextResponse.json(
      { error: 'Crée d\'abord au moins un cours pour générer une épreuve.', code: 'no_courses' },
      { status: 422 }
    )
  }

  const courseIds = courses.map(c => c.id)

  // Récupère les flashcards de ces cours
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('title, summary, course_id')
    .in('course_id', courseIds)
    .not('summary', 'is', null)
    .not('summary', 'eq', '')
    .limit(120)

  if (!flashcards || flashcards.length < 5) {
    await addNovasForUser(user.id, NOVA_COST_EXAM_SIMULATION, 'Remboursement — pas assez de fiches')
    return NextResponse.json(
      { error: 'Tu n\'as pas encore assez de fiches pour générer une épreuve. Crée au moins 2-3 cours complets d\'abord.', code: 'not_enough_content' },
      { status: 422 }
    )
  }

  // Map course_id → subject pour labelliser les fiches
  const subjectMap = Object.fromEntries(courses.map(c => [c.id, c.subject ?? 'Général']))

  const cardContent = flashcards
    .slice(0, 80)
    .map(f => `[${subjectMap[f.course_id] ?? 'Général'}] ${f.title}: ${f.summary}`)
    .join('\n')

  // Génération des questions avec Claude Sonnet
  let questions: ExamQuestion[] = []

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Tu es un concepteur d'examens pour le brevet des collèges français (niveau 3e).

À partir des fiches de révision suivantes d'un élève, génère exactement 20 questions QCM à 4 choix, dans le style du brevet (claires, précises, niveau collège).

FICHES DE L'ÉLÈVE :
${cardContent}

CONSIGNES :
- 20 questions au total, réparties équitablement entre les matières présentes dans les fiches
- Chaque question a exactement 4 options (A, B, C, D), une seule correcte
- Les questions testent la compréhension, pas juste la mémorisation de mots
- Niveau brevet 3e : ni trop simple ni trop difficile
- Le champ "matiere" doit correspondre à la matière de la fiche (ex: "Mathématiques", "Histoire-Géographie", "SVT", "Physique-Chimie", "Français"...)

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown ni texte autour :
[
  {
    "matiere": "Mathématiques",
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": 0
  }
]

"correct" est l'index 0-3 de la bonne réponse dans le tableau "options".`,
      }],
    })

    const raw = (msg.content[0] as any).text.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Format JSON invalide')

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed) || parsed.length < 10) throw new Error('Trop peu de questions')

    questions = parsed.slice(0, 20) as ExamQuestion[]
  } catch (err) {
    await addNovasForUser(user.id, NOVA_COST_EXAM_SIMULATION, 'Remboursement — erreur génération')
    console.error('[brevet/start] Erreur génération:', err)
    return NextResponse.json({ error: 'La génération des questions a échoué. Réessaie dans quelques instants.' }, { status: 500 })
  }

  // Création de la session
  const { data: session, error: insertError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: user.id,
      questions,
      answers: new Array(questions.length).fill(null),
      status: 'pending',
      plan_snapshot: planSnapshot,
    })
    .select('id')
    .single()

  if (insertError || !session) {
    await addNovasForUser(user.id, NOVA_COST_EXAM_SIMULATION, 'Remboursement — erreur insertion')
    return NextResponse.json({ error: 'Erreur lors de la création de la session.' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id })
}
