import { createAdminClient } from '@/lib/supabase/admin'
import { generateQcmForFiches, normalizeQuestionText, type GeneratedQuestion } from './generate'
import { QCM_QUESTIONS_PER_FLASHCARD, type QcmDifficulty } from './prompts'
import { acquireGenerationLock, releaseGenerationLock, lockKeys } from '@/lib/generation-lock'
import * as Sentry from '@sentry/nextjs'

/**
 * Remplissage d'UN niveau de QCM pour toutes les fiches d'un cours.
 *
 * Source unique : la route utilisateur (/api/generate-qcm/level) et le
 * reconciliateur serveur (/api/qcm/reconcile) passent tous les deux par ici.
 *
 * Deux proprietes qui font la difference avec l'ancien code :
 *
 * 1. INSERTION INCREMENTALE. Chaque tour ecrit ses fiches reussies avant
 *    d'entamer le suivant. Avant, tout etait insere a la fin : une fonction
 *    tuee a maxDuration perdait l'integralite du travail, et l'appel suivant
 *    repartait de zero. Maintenant le progres est monotone — c'est ce qui rend
 *    la convergence possible sur plusieurs invocations.
 *
 * 2. BOUCLE DE RETRY BORNEE PAR LE TEMPS, pas par un compteur. On relance tant
 *    qu'il reste des fiches vides ET qu'il reste de quoi payer un tour de plus,
 *    estime sur la duree du tour precedent. L'ancien code avait un seul retry
 *    derriere une echeance fixe a 30 s : si la premiere passe depassait 30 s,
 *    le retry etait saute et le niveau restait partiel (cause n°1 des niveaux
 *    incomplets releves en prod le 26/09).
 *
 * 3. ACCUMULATION ENTRE LES TOURS. Mesure du 26/09 : quand un appel echoue,
 *    c'est presque toujours "4/5 questions valides" — le filtre anti-biais en
 *    rejette une ou deux et il en manque une pour le compte. L'ancien code
 *    jetait les 4 bonnes questions et repartait de zero. On les garde : le
 *    tour suivant n'a plus qu'a en fournir une seule.
 */

export type FillOutcome = {
  /** Le bail etait deja pris : une autre requete travaille sur ce niveau. */
  locked?: boolean
  fichesTotal: number
  /** Fiches ayant des questions a ce niveau a la fin de l'appel. */
  fichesFilled: number
  inserted: number
  rounds: number
  complete: boolean
  /** Raisons de validation du dernier tour, pour les logs. */
  reasons: string[]
}

/** Marge de securite : on n'entame pas un tour qu'on ne pourra pas finir. */
const ROUND_SAFETY_FACTOR = 1.25
/** Estimation du premier tour, avant toute mesure (ms). */
const FIRST_ROUND_ESTIMATE_MS = 14_000
/** Garde-fou anti-boucle si les tours deviennent instantanement vides. */
const MAX_ROUNDS = 8

type FicheRow = { id: string; title: string; summary: string; key_points: unknown }

function parseKeyPoints(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  try {
    const p = JSON.parse(String(raw || '[]'))
    return Array.isArray(p) ? p.map(String) : []
  } catch {
    return []
  }
}

export async function fillQcmLevel(opts: {
  courseId: string
  userId: string
  difficulty: QcmDifficulty
  /** Timestamp ms : on n'entame plus de tour au-dela. */
  deadline: number
  /** Consomme le plafond 40/h + 200/jour. Retourne true si bloque. */
  consumeRateLimit?: (units: number) => Promise<boolean>
}): Promise<FillOutcome> {
  const { courseId, userId, difficulty, deadline } = opts
  const admin = createAdminClient()

  const lockKey = lockKeys.qcmLevel(courseId, difficulty)
  if (!(await acquireGenerationLock(lockKey, userId))) {
    return { locked: true, fichesTotal: 0, fichesFilled: 0, inserted: 0, rounds: 0, complete: false, reasons: [] }
  }

  try {
    // Lu SOUS le bail : une lecture faite avant serait deja perimee.
    const [{ data: flashcards }, { data: existing }] = await Promise.all([
      admin.from('flashcards')
        .select('id, title, summary, key_points')
        .eq('course_id', courseId)
        .order('order_index'),
      admin.from('qcm_questions')
        .select('flashcard_id')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .eq('difficulty', difficulty),
    ])

    const allFiches = (flashcards ?? []) as FicheRow[]
    const filled = new Set((existing ?? []).map((q) => q.flashcard_id as string))
    let remaining = allFiches.filter((f) => !filled.has(f.id))

    const outcome: FillOutcome = {
      fichesTotal: allFiches.length,
      fichesFilled: filled.size,
      inserted: 0,
      rounds: 0,
      complete: remaining.length === 0,
      reasons: [],
    }
    if (remaining.length === 0) return outcome

    let roundEstimate = FIRST_ROUND_ESTIMATE_MS
    // Questions valides accumulees par fiche, tous tours confondus.
    const bank = new Map<string, GeneratedQuestion[]>()

    while (remaining.length > 0 && outcome.rounds < MAX_ROUNDS) {
      const budgetLeft = deadline - Date.now()
      if (budgetLeft < roundEstimate * ROUND_SAFETY_FACTOR) break

      if (opts.consumeRateLimit && (await opts.consumeRateLimit(remaining.length))) {
        outcome.reasons.push('rate limit atteint')
        break
      }

      const roundStart = Date.now()
      outcome.rounds++

      const generated = await generateQcmForFiches(
        remaining.map((f) => ({ title: f.title, summary: f.summary, key_points: parseKeyPoints(f.key_points) })),
        difficulty
      )
      roundEstimate = Math.max(Date.now() - roundStart, 3_000)

      const rows: Array<Record<string, unknown>> = []
      const doneThisRound = new Set<string>()
      for (const f of remaining) {
        const res = generated.get(f.title)
        if (res?.reason) outcome.reasons.push(`${f.title}: ${res.reason}`)
        if (!res || res.questions.length === 0) continue

        // Les questions valides de ce tour rejoignent la banque, meme si elles
        // ne suffisent pas encore. Dedoublonnage sur l'enonce normalise : deux
        // generations sur la meme fiche reposent souvent la meme question.
        const kept = bank.get(f.id) ?? []
        const seen = new Set(kept.map((q) => normalizeQuestionText(q.question)))
        for (const q of res.questions) {
          const key = normalizeQuestionText(q.question)
          if (seen.has(key)) continue
          seen.add(key)
          kept.push(q)
        }
        bank.set(f.id, kept)

        // On n'ecrit qu'un lot complet : une fiche a 3 questions serait comptee
        // comme "remplie" et ne serait plus jamais retentee.
        if (kept.length < QCM_QUESTIONS_PER_FLASHCARD) continue

        doneThisRound.add(f.id)
        for (const q of kept.slice(0, QCM_QUESTIONS_PER_FLASHCARD)) {
          rows.push({
            flashcard_id: f.id,
            course_id: courseId,
            user_id: userId,
            question: q.question,
            options: q.options,
            correct_index: q.correct_index,
            explanation: q.explanation,
            difficulty,
          })
        }
      }

      if (rows.length > 0) {
        // Ecriture immediate : le progres de ce tour doit survivre a une mort
        // de la fonction pendant le tour suivant.
        const { error } = await admin.from('qcm_questions').insert(rows)
        if (error) throw new Error(`Insert QCM: ${error.message}`)
        outcome.inserted += rows.length
        outcome.fichesFilled += doneThisRound.size
      }

      remaining = remaining.filter((f) => !doneThisRound.has(f.id))
    }

    outcome.complete = remaining.length === 0
    if (!outcome.complete) {
      const msg = `QCM ${difficulty} incomplet pour le cours ${courseId} : ${outcome.fichesFilled}/${outcome.fichesTotal} fiches apres ${outcome.rounds} tour(s) — ${outcome.reasons.slice(0, 6).join(' | ')}`
      console.warn('[fillQcmLevel]', msg)
      Sentry.captureMessage(msg, 'warning')
    }
    return outcome
  } finally {
    await releaseGenerationLock(lockKey)
  }
}
