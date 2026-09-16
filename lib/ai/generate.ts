import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'
import {
  getFlashcardSystemPrompt,
  getQcmSystemPrompt,
  buildFlashcardPrompt,
  QCM_QUESTIONS_PER_FLASHCARD,
  type QcmDifficulty,
} from './prompts'

// Client instancie a la demande : le SDK leve une erreur si la cle manque au
// chargement du module, ce qui rendrait les helpers purs (validation) intestables.
let anthropicClient: Anthropic | null = null
function anthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return anthropicClient
}

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
  const message = await anthropic().messages.create({
    model: 'claude-sonnet-5', // Sonnet 5 : $2/$10 par Mtok vs $3/$15 pour 4.6, ~33% moins cher à qualité égale
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

// ─── VALIDATION QUALITE DES QCM ──────────────────────────────────────────────
// Un seul mecanisme pour deux problemes : contenu vide/malforme ET biais de
// longueur (bonne reponse systematiquement plus longue que les distracteurs).

/**
 * Sous ce nombre de questions valides apres le retry, on prefere echouer
 * explicitement plutot que de livrer un QCM squelettique (3 sur 5).
 */
const QCM_MIN_ACCEPTABLE_QUESTIONS = 3

/**
 * Seuil du check anti-biais : la bonne reponse est rejetee si elle compte plus
 * de (1 + seuil) x les mots du distracteur LE PLUS LONG. 0.4 = +40 %.
 * On compare au plus long et non a la moyenne : le prompt demande d'enrichir
 * UN seul distracteur (les 2 autres restent courts), ce qui suffit a casser
 * l'heuristique "la plus longue est la bonne" mais ferait echouer une moyenne.
 * A ajuster empiriquement.
 */
export const QCM_LENGTH_BIAS_THRESHOLD = 0.4

/**
 * En dessous de ce nombre de mots, une bonne reponse n'est jamais consideree
 * biaisee ("1789" vs "1791" : 1 mot contre 1 mot, le ratio n'a pas de sens).
 */
const QCM_LENGTH_BIAS_MIN_WORDS = 4

/** Niveaux soumis au check anti-biais (Paisible n'enrichit aucun distracteur). */
const LENGTH_BIAS_DIFFICULTIES: ReadonlySet<QcmDifficulty> = new Set(['easy', 'medium'])

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Vrai si la bonne reponse est nettement plus longue que le plus long des 3
 * distracteurs — le biais que l'eleve apprend a exploiter sans lire la question.
 */
export function hasLengthBias(
  question: Pick<GeneratedQuestion, 'options' | 'correct_index'>,
  threshold = QCM_LENGTH_BIAS_THRESHOLD
): boolean {
  const correct = question.options[question.correct_index]
  if (typeof correct !== 'string') return false
  const correctWords = countWords(correct)
  if (correctWords < QCM_LENGTH_BIAS_MIN_WORDS) return false
  const distractors = question.options.filter((_, i) => i !== question.correct_index)
  if (distractors.length === 0) return false
  const longest = Math.max(...distractors.map(countWords))
  return correctWords > longest * (1 + threshold)
}

export type QcmValidationResult =
  | { valid: true; questions: GeneratedQuestion[] }
  | { valid: false; questions: GeneratedQuestion[]; reason: string }

/**
 * Filtre les questions malformees (options vides, index hors bornes,
 * explication manquante, biais de longueur) et exige `expectedCount` questions
 * saines. `questions` contient toujours les questions qui ont passe le filtre,
 * meme quand `valid` est false (utile pour le mode degrade apres retry).
 */
export function validateGeneratedQuestions(
  questions: GeneratedQuestion[],
  expectedCount: number,
  difficulty: QcmDifficulty
): QcmValidationResult {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { valid: false, questions: [], reason: 'aucune question' }
  }

  const reasons: string[] = []
  const checkBias = LENGTH_BIAS_DIFFICULTIES.has(difficulty)

  const sane = questions.filter((q) => {
    if (!q.question) { reasons.push('question vide'); return false }
    if (!Array.isArray(q.options) || q.options.length !== 4) { reasons.push('pas 4 options'); return false }
    if (q.options.some((o) => !o)) { reasons.push('option vide'); return false }
    if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index > 3) {
      reasons.push('correct_index hors bornes'); return false
    }
    if (!q.explanation) { reasons.push('explication vide'); return false }
    if (checkBias && hasLengthBias(q)) { reasons.push('biais de longueur'); return false }
    return true
  })

  if (sane.length < expectedCount) {
    reasons.push(`${sane.length}/${expectedCount} questions valides`)
    return { valid: false, questions: sane, reason: [...new Set(reasons)].join(', ') }
  }

  return { valid: true, questions: sane.slice(0, expectedCount) }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

type QcmFlashcardInput = { title: string; summary: string; key_points: string[] }

/**
 * Un appel Claude pour N fiches. Retourne les questions normalisees (non
 * validees) indexees par titre EXACT de la fiche d'entree — le modele est
 * apparie par titre normalise, puis par position en dernier recours.
 */
async function requestQcmBatch(
  flashcards: QcmFlashcardInput[],
  difficulty: QcmDifficulty
): Promise<Map<string, GeneratedQuestion[]>> {
  const fichesList = flashcards
    .map(
      (f, i) =>
        `--- Fiche ${i + 1}: ${f.title} ---\nRésumé: ${f.summary}\nPoints clés: ${f.key_points.join(', ')}`
    )
    .join('\n\n')

  const userPrompt = `Génère exactement ${QCM_QUESTIONS_PER_FLASHCARD} questions QCM pour CHACUNE des ${flashcards.length} fiches suivantes.

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

  const message = await anthropic().messages.create({
    model: 'claude-sonnet-5', // Sonnet 5 : $2/$10 par Mtok vs $3/$15 pour 4.6, ~33% moins cher à qualité égale
    // ~300 tokens par question × 5 × N fiches — 6 fiches = 9 200 tokens, il faut
    // un plafond au-dessus de l'ancien 4096 sinon le JSON est tronqué.
    max_tokens: Math.min(300 * flashcards.length * QCM_QUESTIONS_PER_FLASHCARD + 200, 10000),
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
    console.error('[requestQcmBatch] Parse failed. Raw (first 500):', raw.slice(0, 500))
    return result
  }

  const byNormalizedTitle = new Map(flashcards.map((f) => [normalizeTitle(f.title), f.title]))

  parsed.fiches.forEach((fiche, position) => {
    if (!Array.isArray(fiche.questions)) return
    const inputTitle =
      byNormalizedTitle.get(normalizeTitle(String(fiche.title ?? ''))) ?? flashcards[position]?.title
    if (!inputTitle || result.has(inputTitle)) return

    const normalized: GeneratedQuestion[] = fiche.questions.map((q: any) => {
      const idxRaw = q.correct_index ?? q.correctIndex ?? q.correct ?? q.answer_index ?? 0
      const idx = typeof idxRaw === 'string' ? parseInt(idxRaw, 10) : Number(idxRaw)
      return {
        question: String(q.question || q.text || '').trim(),
        options: Array.isArray(q.options)
          ? q.options.map((o: any) => String(o).trim())
          : Array.isArray(q.choices)
            ? q.choices.map((o: any) => String(o).trim())
            : [],
        correct_index: Number.isFinite(idx) ? idx : -1,
        explanation: String(q.explanation || q.explication || q.reason || '').trim(),
      }
    })

    result.set(inputTitle, normalized)
  })

  return result
}

// OPTIMISATION: toutes les fiches d'un cours en 1 seul appel API
// Avant : 1 appel par fiche (jusqu'à 6 appels). Maintenant : 1 appel total.
//
// Fiabilite : chaque fiche est validee (validateGeneratedQuestions). Les fiches
// invalides sont relancees UNE fois dans un second appel (retry a la charge de
// Skynote, transparent pour l'utilisateur). Si le retry echoue encore :
//   - au moins QCM_MIN_ACCEPTABLE_QUESTIONS valides → on livre en mode degrade
//     et on remonte un warning Sentry ;
//   - sinon la fiche est absente du resultat ; erreur explicite seulement si
//     AUCUNE fiche n'est utilisable (jamais de tableau vide silencieux).
export async function generateAllQcmQuestions(
  flashcards: QcmFlashcardInput[],
  difficulty: QcmDifficulty = 'easy'
): Promise<Map<string, GeneratedQuestion[]>> {
  if (flashcards.length === 0) return new Map()

  const result = new Map<string, GeneratedQuestion[]>()
  const firstPass = await requestQcmBatch(flashcards, difficulty)

  const toRetry: QcmFlashcardInput[] = []
  const firstReasons = new Map<string, string>()
  for (const f of flashcards) {
    const check = validateGeneratedQuestions(firstPass.get(f.title) ?? [], QCM_QUESTIONS_PER_FLASHCARD, difficulty)
    if (check.valid) {
      result.set(f.title, check.questions)
    } else {
      toRetry.push(f)
      firstReasons.set(f.title, check.reason)
    }
  }

  if (toRetry.length === 0) return result

  console.warn(
    `[generateAllQcmQuestions] ${difficulty} : retry pour ${toRetry.length}/${flashcards.length} fiche(s) —`,
    [...firstReasons.entries()].map(([t, r]) => `${t}: ${r}`).join(' | ')
  )

  const secondPass = await requestQcmBatch(toRetry, difficulty)
  const failed: string[] = []

  for (const f of toRetry) {
    const check = validateGeneratedQuestions(secondPass.get(f.title) ?? [], QCM_QUESTIONS_PER_FLASHCARD, difficulty)
    if (check.valid) {
      result.set(f.title, check.questions)
      continue
    }
    if (check.questions.length >= QCM_MIN_ACCEPTABLE_QUESTIONS) {
      // Mode degrade : mieux vaut 3-4 bonnes questions qu'un niveau vide.
      result.set(f.title, check.questions)
      Sentry.captureMessage(
        `QCM degrade (${difficulty}) : ${check.questions.length}/${QCM_QUESTIONS_PER_FLASHCARD} questions pour "${f.title}" — ${check.reason}`,
        'warning'
      )
      continue
    }
    failed.push(`${f.title} (${check.reason})`)
  }

  if (failed.length > 0) {
    const message = `Génération QCM ${difficulty} échouée après retry pour ${failed.length}/${flashcards.length} fiche(s) : ${failed.join(' ; ')}`
    if (result.size === 0) {
      // Rien d'utilisable : erreur explicite (jamais de tableau vide silencieux).
      const error = new Error(message)
      Sentry.captureException(error, { tags: { feature: 'qcm-generation', difficulty } })
      console.error('[generateAllQcmQuestions]', message)
      throw error
    }
    // Lot partiel : on livre les fiches reussies, les manquantes restent
    // regenerables gratuitement (niveau vide) — ne pas perdre 5 fiches pour 1.
    Sentry.captureMessage(message, 'warning')
    console.warn('[generateAllQcmQuestions]', message)
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
