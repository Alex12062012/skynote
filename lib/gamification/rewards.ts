/**
 * REWARD CALCULATOR — fonction pure, testable unitairement.
 * Pas d'I/O Supabase ici : on prend l'état → on renvoie le détail de la récompense.
 */

import {
  DIFFICULTY_COINS,
  EARLY_GAME_BONUS,
  EARLY_GAME_WINDOW,
  QcmDifficulty,
  prestigeMultiplier,
  scoreMultiplier,
  streakBonus,
} from './config'

export interface RewardInput {
  score: number
  total: number
  difficulty: QcmDifficulty
  prestigeLevel: number
  /** streak de 5/5 AVANT cette tentative */
  currentPerfectStreak: number
  /** nombre total de 5/5 parfaits AVANT cette tentative */
  totalPerfectBefore: number
  /** booster ×2 coins actif ? */
  hasX2Boost?: boolean
}

export interface RewardBreakdown {
  base: number
  scoreMultiplier: number
  earnedBeforeBonuses: number
  streakBonus: number
  earlyGameBonus: number
  prestigeMultiplier: number
  x2Multiplier: number
  total: number
  perfect: boolean
  newPerfectStreak: number
  /** lignes à afficher dans le RewardToast */
  breakdown: Array<{ label: string; value: number }>
}

export function computeReward(input: RewardInput): RewardBreakdown {
  const {
    score, total, difficulty, prestigeLevel,
    currentPerfectStreak, totalPerfectBefore, hasX2Boost = false,
  } = input

  const base = DIFFICULTY_COINS[difficulty]
  const mult = scoreMultiplier(score, total)
  const earnedBeforeBonuses = Math.round(base * mult)
  const perfect = score === total && total > 0

  // streak
  const newPerfectStreak = perfect ? currentPerfectStreak + 1 : 0
  const streakAdd = perfect ? streakBonus(newPerfectStreak) : 0

  // early game
  const earlyGameAdd =
    perfect && totalPerfectBefore < EARLY_GAME_WINDOW ? EARLY_GAME_BONUS : 0

  // sub-total avant multiplicateurs
  const subTotal = earnedBeforeBonuses + streakAdd + earlyGameAdd

  // multiplicateurs finaux
  const pMult = prestigeMultiplier(prestigeLevel)        // 1 + 0.05*level
  const x2   = hasX2Boost ? 2 : 1
  const total_ = Math.round(subTotal * pMult * x2)

  const breakdown: Array<{ label: string; value: number }> = []
  if (earnedBeforeBonuses > 0) {
    breakdown.push({ label: `Score ${score}/${total}`, value: earnedBeforeBonuses })
  }
  if (streakAdd > 0)    breakdown.push({ label: `Streak ×${newPerfectStreak}`, value: streakAdd })
  if (earlyGameAdd > 0) breakdown.push({ label: 'Early game',                  value: earlyGameAdd })
  if (prestigeLevel > 0 && subTotal > 0) {
    breakdown.push({
      label: `Prestige ×${prestigeLevel} (+${prestigeLevel * 5}%)`,
      value: Math.round(subTotal * pMult) - subTotal,
    })
  }
  if (hasX2Boost && subTotal > 0) {
    breakdown.push({
      label: 'Boost ×2',
      value: Math.round(subTotal * pMult * x2) - Math.round(subTotal * pMult),
    })
  }

  return {
    base,
    scoreMultiplier: mult,
    earnedBeforeBonuses,
    streakBonus: streakAdd,
    earlyGameBonus: earlyGameAdd,
    prestigeMultiplier: pMult,
    x2Multiplier: x2,
    total: total_,
    perfect,
    newPerfectStreak,
    breakdown,
  }
}

/**
 * Helper : tire un segment de la roue pondérée par weight.
 * Utilisé côté server (edge function) pour empêcher la triche.
 */
export function drawWheelSegment<T extends { weight: number }>(
  segments: readonly T[],
  rng: () => number = Math.random,
): { segment: T; index: number } {
  const totalWeight = segments.reduce((s, x) => s + x.weight, 0)
  let roll = rng() * totalWeight
  for (let i = 0; i < segments.length; i++) {
    roll -= segments[i].weight
    if (roll <= 0) return { segment: segments[i], index: i }
  }
  return { segment: segments[segments.length - 1], index: segments.length - 1 }
}
