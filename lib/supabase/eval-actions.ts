'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================
// TYPES
// ============================================================

export type Evaluation = {
  id: string
  name: string
  exam_date: string
  course_ids: string[]
  created_at: string
}

export type PlanDay = {
  dayNumber: number       // 1-based
  date: string            // ISO date
  isLastDay: boolean
  cardIds: string[]
  cardCount: number
  tip: string             // conseil Anthropic
}

export type EvalPlan = {
  eval: Evaluation
  days: PlanDay[]
  todayIndex: number      // index dans days[] correspondant à aujourd'hui, -1 si hors période
  totalCards: number
}

type FlashcardRow = {
  id: string
  title: string
  mastery_level: number
  ease_factor: number
  course_id: string
}

// ============================================================
// createEvaluation
// ============================================================

export async function createEvaluation(
  name: string,
  examDate: string,
  courseIds: string[]
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)
  const diffDays = Math.round((exam.getTime() - today.getTime()) / 86400000)

  if (diffDays < 2) return { error: 'La date doit être au moins dans 2 jours' }
  if (courseIds.length === 0) return { error: 'Sélectionne au moins un cours' }

  const { data, error } = await supabase
    .from('evaluations')
    .insert({ user_id: user.id, name, exam_date: examDate, course_ids: courseIds })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { id: data.id }
}

// ============================================================
// deleteEvaluation
// ============================================================

export async function deleteEvaluation(evalId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('evaluations')
    .delete()
    .eq('id', evalId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

// ============================================================
// getActiveEvaluations
// ============================================================

export async function getActiveEvaluations(): Promise<Evaluation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('evaluations')
    .select('*')
    .eq('user_id', user.id)
    .gte('exam_date', today)
    .order('exam_date', { ascending: true })

  return (data as Evaluation[]) ?? []
}

// ============================================================
// buildEvalPlan — algorithme + Anthropic tips
// ============================================================

export async function buildEvalPlan(evalId: string): Promise<EvalPlan | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: evalData } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', evalId)
    .eq('user_id', user.id)
    .single()

  if (!evalData) return null

  // Récupérer toutes les flashcards des cours sélectionnés
  const { data: cards } = await supabase
    .from('flashcards')
    .select('id, title, mastery_level, ease_factor, course_id')
    .eq('user_id', user.id)
    .in('course_id', evalData.course_ids)

  const allCards: FlashcardRow[] = (cards as FlashcardRow[]) ?? []
  if (allCards.length === 0) return null

  // Calcul des jours
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(evalData.exam_date)
  exam.setHours(0, 0, 0, 0)
  const totalDays = Math.round((exam.getTime() - today.getTime()) / 86400000)

  if (totalDays < 1) return null

  // Cartes difficiles pour le dernier jour (veille)
  const hardCards = allCards.filter(c => c.mastery_level < 3 || c.ease_factor < 2.0)
  const normalCards = [...allCards]

  const studyDays = totalDays  // inclut le jour du contrôle comme "veille"
  const daysBeforeLast = studyDays - 1

  // Distribuer equitablement sur les jours hors dernier
  const chunks: string[][] = Array.from({ length: daysBeforeLast }, () => [])
  normalCards.forEach((card, i) => {
    chunks[i % daysBeforeLast].push(card.id)
  })

  // Construire le plan brut
  const rawDays: { date: string; isLastDay: boolean; cardIds: string[]; titles: string[] }[] = []

  for (let d = 0; d < daysBeforeLast; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d)
    const cardIds = chunks[d]
    rawDays.push({
      date: date.toISOString().split('T')[0],
      isLastDay: false,
      cardIds,
      titles: cardIds
        .map(id => allCards.find(c => c.id === id)?.title ?? '')
        .filter(Boolean)
        .slice(0, 5),
    })
  }

  // Dernier jour (veille du contrôle)
  const lastDate = new Date(exam)
  lastDate.setDate(exam.getDate() - 1)
  rawDays.push({
    date: lastDate.toISOString().split('T')[0],
    isLastDay: true,
    cardIds: hardCards.length > 0 ? hardCards.map(c => c.id) : allCards.map(c => c.id),
    titles: (hardCards.length > 0 ? hardCards : allCards)
      .map(c => c.title)
      .slice(0, 5),
  })

  // Générer les tips Anthropic
  const tips = await generateTips(evalData.name, rawDays)

  // Trouver le jour courant
  const todayStr = today.toISOString().split('T')[0]
  const todayIndex = rawDays.findIndex(d => d.date === todayStr)

  const days: PlanDay[] = rawDays.map((d, i) => ({
    dayNumber: i + 1,
    date: d.date,
    isLastDay: d.isLastDay,
    cardIds: d.cardIds,
    cardCount: d.cardIds.length,
    tip: tips[i] ?? '',
  }))

  return {
    eval: evalData as Evaluation,
    days,
    todayIndex,
    totalCards: allCards.length,
  }
}

// ============================================================
// generateTips — appel Anthropic léger
// ============================================================

async function generateTips(
  evalName: string,
  days: { isLastDay: boolean; titles: string[] }[]
): Promise<string[]> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    const prompt = `Tu es un coach de révision. Pour un contrôle "${evalName}", génère un conseil de révision court (max 12 mots) pour chaque jour.
Réponds UNIQUEMENT avec un JSON array de strings, un par jour, dans l'ordre.
Jours :
${days.map((d, i) => `Jour ${i + 1}${d.isLastDay ? ' (VEILLE, révision difficile)' : ''}: ${d.titles.join(', ') || 'révision générale'}`).join('\n')}
Exemple de format : ["Commence par...", "Focus sur...", "Dernier passage..."]`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed as string[]
    return days.map(() => '')
  } catch {
    return days.map((d) =>
      d.isLastDay ? 'Revois les points les plus difficiles.' : 'Révise régulièrement.'
    )
  }
}

// ============================================================
// getTodayCards — cartes à réviser aujourd'hui pour une éval
// ============================================================

export async function getTodayCards(evalId: string): Promise<{
  cardIds: string[]
  isLastDay: boolean
  tip: string
} | null> {
  const plan = await buildEvalPlan(evalId)
  if (!plan || plan.todayIndex === -1) return null

  const today = plan.days[plan.todayIndex]
  return {
    cardIds: today.cardIds,
    isLastDay: today.isLastDay,
    tip: today.tip,
  }
}
