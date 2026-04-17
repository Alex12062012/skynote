import Anthropic from '@anthropic-ai/sdk'
import {
  FLASHCARD_SYSTEM_PROMPT,
  QCM_SYSTEM_PROMPT,
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
  content: string
): Promise<GeneratedFlashcard[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: FLASHCARD_SYSTEM_PROMPT,
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

export async function generateQcmQuestions(
  flashcardTitle: string,
  summary: string,
  keyPoints: string[],
  difficulty: QcmDifficulty = 'easy'
): Promise<GeneratedQuestion[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: getQcmSystemPrompt(difficulty),
    messages: [{ role: 'user', content: buildQcmPrompt(flashcardTitle, summary, keyPoints) }],
  })

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const parsed = parseClaudeJSON<{ questions: GeneratedQuestion[] }>(raw)
  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Réponse IA invalide pour le QCM')
  }

  return parsed.questions
    .filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correct_index === 'number' &&
        q.correct_index >= 0 &&
        q.correct_index <= 3 &&
        q.explanation
    )
    .map((q) => ({
      question: String(q.question).trim(),
      options: q.options.map((o) => String(o).trim()),
      correct_index: Number(q.correct_index),
      explanation: String(q.explanation).trim(),
    }))
    .slice(0, 5)
}
