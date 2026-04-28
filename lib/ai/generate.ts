import Anthropic from '@anthropic-ai/sdk'
import {
  getFlashcardSystemPrompt,
  getQcmSystemPrompt,
  buildFlashcardPrompt,
  buildQcmPrompt,
  type QcmDifficulty,
} from './prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface GeneratedFlashcard {
  title: string
  summary: string
  key_points: string[]
}

export interface GeneratedQuestion {
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

function parseClaudeJSON<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as T } catch { return null }
    }
    return null
  }
}

function deduplicateFlashcards(flashcards: GeneratedFlashcard[]): GeneratedFlashcard[] {
  const seen = new Set<string>()
  return flashcards.filter((f) => {
    const normalized = f.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    const prefix = normalized.slice(0, 20)
    if (seen.has(normalized) || [...seen].some((s) => s.startsWith(prefix) && prefix.length > 8)) {
      return false
    }
    seen.add(normalized)
    return true
  })
}

const MAX_FLASHCARDS = 6

export async function generateFlashcards(
  courseTitle: string,
  subject: string,
  content: string,
  lang?: string
): Promise<GeneratedFlashcard[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    // OPTIMISATION: réduit de 2048 à 1200 — 6 fiches courtes ne dépassent jamais 800 tokens
    max_tokens: 1200,
    system: getFlashcardSystemPrompt(lang),
    messages: [{ role: 'user', content: buildFlashcardPrompt(courseTitle, subject, content) }],
  })

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const parsed = parseClaudeJSON<{ flashcards: GeneratedFlashcard[] }>(raw)
  if (!parsed?.flashcards || !Array.isArray(parsed.flashcards)) {
    throw new Error('Réponse IA invalide pour les fiches')
  }

  const cleaned = parsed.flashcards
    .filter((f) => f.title && f.summary && Array.isArray(f.key_points))
    .map((f) => ({
      title: String(f.title).trim(),
      summary: String(f.summary).trim(),
      key_points: f.key_points
        .filter((p) => typeof p === 'string' && p.trim())
        .map((p) => String(p).trim())
        .slice(0, 3),
    }))

  const deduped = deduplicateFlashcards(cleaned)
  const limited = deduped.slice(0, MAX_FLASHCARDS)

  if (limited.length === 0) {
    throw new Error("Aucune fiche valide générée par l'IA")
  }

  return limited
}

// OPTIMISATION: toutes les fiches d'un cours en 1 seul appel API
// Avant : 1 appel par fiche (jusqu'à 6 appels). Maintenant : 1 appel total.
export async function generateAllQcmQuestions(
  flashcards: Array<{
    title: string
    summary: string
    key_points: string[]
  }>,
  difficulty: QcmDifficulty = 'easy'
): Promise<Map<string, GeneratedQuestion[]>> {
  if (flashcards.length === 0) return new Map()

  const fichesList = flashcards
    .map(
      (f, i) =>
        `--- Fiche ${i + 1}: ${f.title} ---\nRésumé: ${f.summary}\nPoints clés: ${f.key_points.join(', ')}`
    )
    .join('\n\n')

  const userPrompt = `Génère exactement 3 questions QCM pour CHACUNE des ${flashcards.length} fiches suivantes.

${fichesList}

Réponds avec un JSON structuré ainsi :
{
  "fiches": [
    {
      "title": "titre exact de la fiche",
      "questions": [
        {
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "explanation": "..."
        }
      ]
    }
  ]
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    // 3 questions × N fiches, budget confortable
    max_tokens: Math.min(300 * flashcards.length * 3 + 200, 4096),
    system: getQcmSystemPrompt(difficulty),
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const parsed = parseClaudeJSON<{ fiches: Array<{ title: string; questions: any[] }> }>(raw)
  const result = new Map<string, GeneratedQuestion[]>()

  if (!parsed?.fiches || !Array.isArray(parsed.fiches)) {
    console.error('[generateAllQcmQuestions] Parse failed. Raw (first 500):', raw.slice(0, 500))
    return result
  }

  for (const fiche of parsed.fiches) {
    if (!fiche.title || !Array.isArray(fiche.questions)) continue

    const normalized = fiche.questions.map((q: any) => {
      const idxRaw = q.correct_index ?? q.correctIndex ?? q.correct ?? q.answer_index ?? 0
      const idx = typeof idxRaw === 'string' ? parseInt(idxRaw, 10) : Number(idxRaw)
      return {
        question: String(q.question || q.text || '').trim(),
        options: Array.isArray(q.options)
          ? q.options.map((o: any) => String(o).trim())
          : Array.isArray(q.choices)
            ? q.choices.map((o: any) => String(o).trim())
            : [],
        correct_index: Number.isFinite(idx) ? idx : 0,
        explanation: String(q.explanation || q.explication || q.reason || '').trim(),
      }
    })

    const filtered = normalized.filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correct_index === 'number' &&
        q.correct_index >= 0 &&
        q.correct_index <= 3 &&
        q.explanation
    )

    result.set(fiche.title, filtered.slice(0, 5))
  }

  return result
}

// Conservé pour compatibilité si appelé sur une fiche isolée (ex: nouvelle fiche ajoutée)
export async function generateQcmQuestions(
  flashcardTitle: string,
  summary: string,
  keyPoints: string[],
  difficulty: QcmDifficulty = 'easy'
): Promise<GeneratedQuestion[]> {
  const map = await generateAllQcmQuestions(
    [{ title: flashcardTitle, summary, key_points: keyPoints }],
    difficulty
  )
  return map.get(flashcardTitle) ?? []
}
