import Anthropic from '@anthropic-ai/sdk'
import {
  FLASHCARD_SYSTEM_PROMPT,
  QCM_SYSTEM_PROMPT,
  buildFlashcardPrompt,
  buildQcmPrompt,
} from './prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// UTILITAIRE — Parser JSON Claude en toute sécurité
// ============================================================

function parseClaudeJSON<T>(raw: string): T | null {
  try {
    // Supprimer les éventuels backticks markdown
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    // Tenter d'extraire le JSON avec regex
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0]) as T
      } catch {
        return null
      }
    }
    return null
  }
}

// ============================================================
// GÉNÉRATION DES FICHES DE RÉVISION
// ============================================================

export async function generateFlashcards(
  courseTitle: string,
  subject: string,
  content: string
): Promise<GeneratedFlashcard[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: FLASHCARD_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildFlashcardPrompt(courseTitle, subject, content),
      },
    ],
  })

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const parsed = parseClaudeJSON<{ flashcards: GeneratedFlashcard[] }>(raw)

  if (!parsed?.flashcards || !Array.isArray(parsed.flashcards)) {
    throw new Error('Réponse IA invalide pour les fiches')
  }

  // Valider et nettoyer chaque fiche
  return parsed.flashcards
    .filter((f) => f.title && f.summary && Array.isArray(f.key_points))
    .map((f) => ({
      title: String(f.title).trim(),
      summary: String(f.summary).trim(),
      key_points: f.key_points
        .filter((p) => typeof p === 'string' && p.trim())
        .map((p) => String(p).trim())
        .slice(0, 5),
    }))
    .slice(0, 6)
}

// ============================================================
// GÉNÉRATION DES QUESTIONS QCM
// ============================================================

export async function generateQcmQuestions(
  flashcardTitle: string,
  summary: string,
  keyPoints: string[]
): Promise<GeneratedQuestion[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: QCM_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildQcmPrompt(flashcardTitle, summary, keyPoints),
      },
    ],
  })

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const parsed = parseClaudeJSON<{ questions: GeneratedQuestion[] }>(raw)

  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Réponse IA invalide pour le QCM')
  }

  // Valider chaque question
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
