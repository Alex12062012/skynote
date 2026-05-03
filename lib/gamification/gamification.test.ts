import { describe, it, expect } from 'vitest'
import {
  scoreMultiplier,
  streakBonus,
  prestigeCost,
  prestigeMultiplier,
  DIFFICULTY_COINS,
  WHEEL_COST,
  WHEEL_SEGMENTS,
} from './config'
import { computeReward, drawWheelSegment } from './rewards'

// ─── scoreMultiplier ──────────────────────────────────────────────────────────
describe('scoreMultiplier', () => {
  it('5/5 → 1.0 (parfait)', () => expect(scoreMultiplier(5, 5)).toBe(1))
  it('4/5 → 0.5 (une erreur)', () => expect(scoreMultiplier(4, 5)).toBe(0.5))
  it('3/5 → 0 (≥ 2 erreurs)', () => expect(scoreMultiplier(3, 5)).toBe(0))
  it('0/5 → 0', () => expect(scoreMultiplier(0, 5)).toBe(0))
  it('total=0 → 0 (pas de division par zéro)', () => expect(scoreMultiplier(0, 0)).toBe(0))
})

// ─── streakBonus ──────────────────────────────────────────────────────────────
describe('streakBonus', () => {
  it('streak 3 → +5 coins', () => expect(streakBonus(3)).toBe(5))
  it('streak 5 → +15 coins', () => expect(streakBonus(5)).toBe(15))
  it('streak 2 → 0 (pas de seuil)', () => expect(streakBonus(2)).toBe(0))
  it('streak 4 → 0 (pas de seuil)', () => expect(streakBonus(4)).toBe(0))
  it('streak 10 → 0 (seuil dépassé)', () => expect(streakBonus(10)).toBe(0))
})

// ─── prestigeCost ─────────────────────────────────────────────────────────────
describe('prestigeCost', () => {
  it('P0 → P1 coûte 500', () => expect(prestigeCost(0)).toBe(500))
  it('P1 → P2 coûte 1000', () => expect(prestigeCost(1)).toBe(1000))
  it('P2 → P3 coûte 1500', () => expect(prestigeCost(2)).toBe(1500))
  it('coût croît linéairement', () => {
    expect(prestigeCost(3)).toBe(2000)
    expect(prestigeCost(9)).toBe(5000)
  })
})

// ─── prestigeMultiplier ───────────────────────────────────────────────────────
describe('prestigeMultiplier', () => {
  it('P0 → ×1.00', () => expect(prestigeMultiplier(0)).toBe(1))
  it('P1 → ×1.05', () => expect(prestigeMultiplier(1)).toBeCloseTo(1.05))
  it('P5 → ×1.25', () => expect(prestigeMultiplier(5)).toBeCloseTo(1.25))
  it('jamais inférieur à 1', () => expect(prestigeMultiplier(0)).toBeGreaterThanOrEqual(1))
})

// ─── computeReward ────────────────────────────────────────────────────────────
describe('computeReward', () => {
  // totalPerfectBefore = EARLY_GAME_WINDOW pour désactiver le bonus early game
  const base = {
    score: 5, total: 5, difficulty: 'medium' as const,
    prestigeLevel: 0, currentPerfectStreak: 0, totalPerfectBefore: 10,
  }

  it('5/5 medium sans bonus → DIFFICULTY_COINS.medium', () => {
    const r = computeReward(base)
    expect(r.total).toBe(DIFFICULTY_COINS.medium)
    expect(r.perfect).toBe(true)
    expect(r.earlyGameBonus).toBe(0)
  })

  it('4/5 → 50% des coins de base', () => {
    const r = computeReward({ ...base, score: 4 })
    expect(r.earnedBeforeBonuses).toBe(Math.round(DIFFICULTY_COINS.medium * 0.5))
    expect(r.perfect).toBe(false)
  })

  it('3/5 → 0 coins', () => {
    const r = computeReward({ ...base, score: 3 })
    expect(r.total).toBe(0)
  })

  it('streak 3 ajoute le bonus streak', () => {
    const r = computeReward({ ...base, currentPerfectStreak: 2 })
    expect(r.streakBonus).toBe(5)
  })

  it('streak 5 ajoute le bonus streak 15', () => {
    const r = computeReward({ ...base, currentPerfectStreak: 4 })
    expect(r.streakBonus).toBe(15)
  })

  it('early game (< 10 parfaits) ajoute +5', () => {
    const r = computeReward({ ...base, totalPerfectBefore: 5 })
    expect(r.earlyGameBonus).toBe(5)
  })

  it('après la fenêtre early game (≥ 10), pas de bonus', () => {
    const r = computeReward({ ...base, totalPerfectBefore: 10 })
    expect(r.earlyGameBonus).toBe(0)
  })

  it('prestige 2 → multiplicateur ×1.10', () => {
    const r = computeReward({ ...base, prestigeLevel: 2 })
    const expected = Math.round(DIFFICULTY_COINS.medium * prestigeMultiplier(2))
    expect(r.total).toBe(expected)
  })

  it('x2 boost double le total', () => {
    const rNormal = computeReward(base)
    const rBoost  = computeReward({ ...base, hasX2Boost: true })
    expect(rBoost.total).toBe(rNormal.total * 2)
  })

  it('x2 boost + prestige se cumulent', () => {
    const r = computeReward({ ...base, prestigeLevel: 2, hasX2Boost: true })
    const expected = Math.round(DIFFICULTY_COINS.medium * prestigeMultiplier(2) * 2)
    expect(r.total).toBe(expected)
  })

  it('5/5 non-parfait (score < total) → newPerfectStreak reset à 0', () => {
    const r = computeReward({ ...base, score: 4, currentPerfectStreak: 3 })
    expect(r.newPerfectStreak).toBe(0)
  })
})

// ─── drawWheelSegment ─────────────────────────────────────────────────────────
describe('drawWheelSegment', () => {
  it('toujours retourne un segment valide', () => {
    for (let i = 0; i < 100; i++) {
      const { segment } = drawWheelSegment(WHEEL_SEGMENTS)
      expect(segment).toBeDefined()
      expect(typeof segment.id).toBe('string')
    }
  })

  it('rng=0 → premier segment', () => {
    const { segment } = drawWheelSegment(WHEEL_SEGMENTS, () => 0)
    expect(segment.id).toBe(WHEEL_SEGMENTS[0].id)
  })

  it('rng=0.9999 → dernier segment (distribution extrême)', () => {
    const { segment } = drawWheelSegment(WHEEL_SEGMENTS, () => 0.9999)
    expect(segment.id).toBe(WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1].id)
  })

  it('distribue les poids — "lost" ~38% sur 10 000 tirages', () => {
    let lostCount = 0
    const N = 10_000
    for (let i = 0; i < N; i++) {
      const { segment } = drawWheelSegment(WHEEL_SEGMENTS)
      if (segment.type === 'lost') lostCount++
    }
    const ratio = lostCount / N
    expect(ratio).toBeGreaterThan(0.33)
    expect(ratio).toBeLessThan(0.43)
  })

  it('EV négative — le joueur perd en moyenne des coins sur 1000 tours', () => {
    let netTotal = 0
    const N = 1000
    for (let i = 0; i < N; i++) {
      const { segment } = drawWheelSegment(WHEEL_SEGMENTS)
      const gain = segment.type === 'coins' ? (segment as any).value : 0
      netTotal += gain - WHEEL_COST
    }
    expect(netTotal / N).toBeLessThan(0)
  })
})
