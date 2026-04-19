/**
 * Moteur SM-2 — algorithme de répétition espacée
 * Grades : 0=again, 3=hard, 4=good, 5=easy
 */

export type SM2Grade = 0 | 3 | 4 | 5

export interface SM2Card {
  ease_factor: number
  interval_days: number
  repetitions: number
}

export interface SM2Result {
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: Date
}

export function applySM2(card: SM2Card, grade: SM2Grade): SM2Result {
  const now = new Date()

  // Nouvelle ease factor (min 1.3)
  const newEase = Math.max(
    1.3,
    card.ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  )

  let newInterval: number
  let newRepetitions: number

  if (grade === 0) {
    // Again — reset
    newInterval = 1
    newRepetitions = 0
  } else {
    newRepetitions = card.repetitions + 1

    if (newRepetitions === 1) {
      newInterval = grade === 5 ? 4 : 1
    } else if (newRepetitions === 2) {
      newInterval = grade === 5 ? 10 : 6
    } else {
      if (grade === 3) {
        newInterval = Math.round(card.interval_days * 1.2)
      } else if (grade === 4) {
        newInterval = Math.round(card.interval_days * newEase)
      } else {
        // grade === 5
        newInterval = Math.round(card.interval_days * newEase * 1.3)
      }
    }

    // Minimum 1 jour
    newInterval = Math.max(1, newInterval)
  }

  const next = new Date(now)
  next.setDate(next.getDate() + newInterval)

  return {
    ease_factor: newEase,
    interval_days: newInterval,
    repetitions: newRepetitions,
    next_review_at: next,
  }
}

/** Coins attribués par grade */
export const GRADE_COINS: Record<SM2Grade, number> = {
  0: 0,
  3: 1,
  4: 2,
  5: 3,
}
