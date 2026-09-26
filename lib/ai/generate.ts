import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'
import {
  getFlashcardSystemPrompt,
  getQcmSystemPrompt,
  buildFlashcardPrompt,
  buildQcmPrompt,
  QCM_QUESTIONS_PER_FLASHCARD,
  QCM_QUESTIONS_REQUESTED,
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

const MAX_FLASHCARDS = 4

export async function generateFlashcards(
  courseTitle: string,
  subject: string,
  content: string,
  lang?: string
): Promise<GeneratedFlashcard[]> {
  const message = await anthropic().messages.create({
    model: 'claude-sonnet-5', // Sonnet 5 : $2/$10 par Mtok vs $3/$15 pour 4.6, ~33% moins cher à qualité égale
    // OPTIMISATION: réduit de 2048 à 1200 — 4 fiches courtes ne dépassent jamais 800 tokens
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

export type QcmFlashcardInput = { title: string; summary: string; key_points: string[] }

/**
 * Modele de generation des QCM.
 *
 * Mesure du 2026-09-26 (scripts/qcm-bench, 4 fiches reelles x 3 niveaux) :
 * voir scripts/qcm-bench/README.md pour le tableau complet. Le choix se joue
 * sur la latence, parce que c'est elle qui decide si un retry rentre dans les
 * 60 s de la fonction Vercel.
 */
export const QCM_MODEL = 'claude-haiku-4-5-20251001'

/**
 * Plafond de sortie par appel. Une fiche = `QCM_QUESTIONS_REQUESTED` questions
 * courtes (options <= 12 mots, explication <= 20 mots) : environ 900 tokens
 * mesures. 3 000 laisse trois fois la marge.
 *
 * L'ancienne formule (600 x fiches x questions + 300) donnait 3 900 pour une
 * fiche et le niveau Hardcore la depassait vraiment : reponse tronquee, JSON
 * invalide, et comme rien ne regardait `stop_reason`, ca ressortait en
 * « Parse failed » sans dire pourquoi.
 */
const QCM_MAX_TOKENS = 3000

export type FicheQcmResult = {
  /** Questions valides retenues (vide si l'appel n'a rien d'utilisable). */
  questions: GeneratedQuestion[]
  /** Renseigne des que le lot n'est pas complet — sert aux logs et au retry. */
  reason?: string
}

function extractText(message: { content: Array<{ type: string }> }): string {
  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as unknown as { text: string }).text)
    .join('')
}

function normalizeQuestions(raw: unknown[]): GeneratedQuestion[] {
  return raw.map((item) => {
    const q = item as Record<string, unknown>
    const idxRaw = q.correct_index ?? q.correctIndex ?? q.correct ?? q.answer_index ?? 0
    const idx = typeof idxRaw === 'string' ? parseInt(idxRaw, 10) : Number(idxRaw)
    const opts = Array.isArray(q.options) ? q.options : Array.isArray(q.choices) ? q.choices : []
    return {
      question: String(q.question || q.text || '').trim(),
      options: opts.map((o) => String(o).trim()),
      correct_index: Number.isFinite(idx) ? idx : -1,
      explanation: String(q.explanation || q.explication || q.reason || '').trim(),
    }
  })
}

/**
 * UNE tentative pour UNE fiche. Ne relance rien : la convergence est le travail
 * de `fillQcmLevel`, qui sait combien de temps il lui reste. Melanger les deux
 * est ce qui produisait l'ancien « retry saute (budget temps depasse) ».
 */
async function requestQcmForFiche(
  fiche: QcmFlashcardInput,
  difficulty: QcmDifficulty
): Promise<FicheQcmResult> {
  const message = await anthropic().messages.create({
    model: QCM_MODEL,
    max_tokens: QCM_MAX_TOKENS,
    system: getQcmSystemPrompt(difficulty, QCM_QUESTIONS_REQUESTED),
    messages: [{ role: 'user', content: buildQcmPrompt(fiche) }],
  })

  // Diagnostic explicite : une troncature n'est pas un JSON mal forme, et le
  // remede n'est pas le meme.
  if (message.stop_reason === 'max_tokens') {
    return { questions: [], reason: `reponse tronquee a ${QCM_MAX_TOKENS} tokens` }
  }

  const raw = extractText(message)
  if (!raw.trim()) return { questions: [], reason: 'reponse vide' }

  const parsed = parseClaudeJSON<{ questions: unknown[] }>(raw)
  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    console.error('[requestQcmForFiche] JSON illisible. Debut brut :', raw.slice(0, 300))
    return { questions: [], reason: 'JSON illisible' }
  }

  const check = validateGeneratedQuestions(
    normalizeQuestions(parsed.questions),
    QCM_QUESTIONS_PER_FLASHCARD,
    difficulty
  )
  return check.valid
    ? { questions: check.questions }
    : { questions: check.questions, reason: check.reason }
}

/**
 * Une tentative pour chaque fiche, en parallele. Les fiches sont independantes :
 * l'echec de l'une ne prive pas les autres de leur resultat.
 */
export async function generateQcmForFiches(
  fiches: QcmFlashcardInput[],
  difficulty: QcmDifficulty
): Promise<Map<string, FicheQcmResult>> {
  const settled = await Promise.allSettled(
    fiches.map((f) => requestQcmForFiche(f, difficulty))
  )
  const out = new Map<string, FicheQcmResult>()
  settled.forEach((r, i) => {
    const title = fiches[i].title
    if (r.status === 'fulfilled') {
      out.set(title, r.value)
    } else {
      const err = r.reason as { status?: number; message?: string }
      out.set(title, { questions: [], reason: `appel echoue: ${err?.status ?? ''} ${err?.message ?? ''}`.trim() })
    }
  })
  return out
}

/** Une fiche isolee (regeneration payante d'un niveau). */
/** Enonce normalise, pour ne pas empiler deux fois la meme question. */
export function normalizeQuestionText(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Une fiche isolee (regeneration payante d'un niveau), avec la meme mecanique
 * d'accumulation que `fillQcmLevel` : on relance tant qu'il manque des
 * questions et qu'il reste du temps, en gardant les valides de chaque tour.
 *
 * Indispensable ici : l'appelant a deja debite 4 Novas et va SUPPRIMER le jeu
 * existant. Rendre 3 questions au lieu de 5 serait une regression payante.
 * Un tableau plus court que `QCM_QUESTIONS_PER_FLASHCARD` signale a l'appelant
 * qu'il doit annuler plutot que d'ecraser.
 */
export async function generateQcmQuestions(
  flashcardTitle: string,
  summary: string,
  keyPoints: string[],
  difficulty: QcmDifficulty = 'easy',
  options: { deadline?: number } = {}
): Promise<GeneratedQuestion[]> {
  const fiche = { title: flashcardTitle, summary, key_points: keyPoints }
  const deadline = options.deadline ?? Date.now() + 40_000
  const bank: GeneratedQuestion[] = []
  const seen = new Set<string>()
  let roundEstimate = 12_000

  for (let round = 0; round < 5; round++) {
    if (round > 0 && deadline - Date.now() < roundEstimate * 1.25) break

    const startedAt = Date.now()
    const res = (await generateQcmForFiches([fiche], difficulty)).get(flashcardTitle)
    roundEstimate = Math.max(Date.now() - startedAt, 3_000)

    for (const q of res?.questions ?? []) {
      const key = normalizeQuestionText(q.question)
      if (seen.has(key)) continue
      seen.add(key)
      bank.push(q)
    }
    if (bank.length >= QCM_QUESTIONS_PER_FLASHCARD) break
  }

  return bank.slice(0, QCM_QUESTIONS_PER_FLASHCARD)
}
