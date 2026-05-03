import { describe, it, expect } from 'vitest'
import { applySM2, GRADE_COINS, type SM2Card } from './sm2'

const BASE_CARD: SM2Card = { ease_factor: 2.5, interval_days: 1, repetitions: 0 }

describe('applySM2 — grade 0 (Again)', () => {
  it('réinitialise repetitions et interval à 1', () => {
    const result = applySM2({ ...BASE_CARD, repetitions: 5, interval_days: 30 }, 0)
    expect(result.repetitions).toBe(0)
    expect(result.interval_days).toBe(1)
  })

  it('la ease_factor descend mais reste ≥ 1.3', () => {
    const result = applySM2(BASE_CARD, 0)
    expect(result.ease_factor).toBeGreaterThanOrEqual(1.3)
  })
})

describe('applySM2 — grade 3 (Hard)', () => {
  it('1ère révision → interval 1 jour', () => {
    const result = applySM2(BASE_CARD, 3)
    expect(result.interval_days).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('2ème révision → interval 6 jours', () => {
    const card: SM2Card = { ease_factor: 2.5, interval_days: 1, repetitions: 1 }
    const result = applySM2(card, 3)
    expect(result.interval_days).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('3ème révision → interval_days * 1.2', () => {
    const card: SM2Card = { ease_factor: 2.5, interval_days: 10, repetitions: 2 }
    const result = applySM2(card, 3)
    expect(result.interval_days).toBe(Math.round(10 * 1.2))
  })

  it('ease_factor diminue', () => {
    const result = applySM2(BASE_CARD, 3)
    expect(result.ease_factor).toBeLessThan(BASE_CARD.ease_factor)
  })
})

describe('applySM2 — grade 4 (Good)', () => {
  it('1ère révision → interval 1 jour', () => {
    const result = applySM2(BASE_CARD, 4)
    expect(result.interval_days).toBe(1)
  })

  it('2ème révision → interval 6 jours', () => {
    const card: SM2Card = { ease_factor: 2.5, interval_days: 1, repetitions: 1 }
    const result = applySM2(card, 4)
    expect(result.interval_days).toBe(6)
  })

  it('3ème+ révision → interval * ease_factor', () => {
    const card: SM2Card = { ease_factor: 2.5, interval_days: 6, repetitions: 2 }
    const result = applySM2(card, 4)
    const newEase = Math.max(1.3, 2.5 + (0.1 - 1 * (0.08 + 1 * 0.02)))
    expect(result.interval_days).toBe(Math.max(1, Math.round(6 * newEase)))
  })
})

describe('applySM2 — grade 5 (Easy)', () => {
  it('1ère révision → interval 4 jours', () => {
    const result = applySM2(BASE_CARD, 5)
    expect(result.interval_days).toBe(4)
  })

  it('2ème révision → interval 10 jours', () => {
    const card: SM2Card = { ease_factor: 2.5, interval_days: 4, repetitions: 1 }
    const result = applySM2(card, 5)
    expect(result.interval_days).toBe(10)
  })

  it('3ème+ révision → interval * ease * 1.3 (bonus easy)', () => {
    const card: SM2Card = { ease_factor: 2.5, interval_days: 10, repetitions: 2 }
    const result = applySM2(card, 5)
    const newEase = Math.max(1.3, 2.5 + 0.1)
    expect(result.interval_days).toBe(Math.max(1, Math.round(10 * newEase * 1.3)))
  })

  it('ease_factor augmente', () => {
    const result = applySM2(BASE_CARD, 5)
    expect(result.ease_factor).toBeGreaterThan(BASE_CARD.ease_factor)
  })
})

describe('applySM2 — ease_factor plancher', () => {
  it('ease_factor ne descend jamais sous 1.3', () => {
    let card: SM2Card = { ease_factor: 1.3, interval_days: 1, repetitions: 0 }
    for (let i = 0; i < 10; i++) {
      const result = applySM2(card, 0)
      expect(result.ease_factor).toBeGreaterThanOrEqual(1.3)
      card = { ease_factor: result.ease_factor, interval_days: result.interval_days, repetitions: result.repetitions }
    }
  })
})

describe('applySM2 — interval minimum', () => {
  it('interval est toujours ≥ 1', () => {
    const result = applySM2({ ease_factor: 1.3, interval_days: 0, repetitions: 3 }, 3)
    expect(result.interval_days).toBeGreaterThanOrEqual(1)
  })
})

describe('applySM2 — next_review_at', () => {
  it('next_review_at est dans le futur', () => {
    const result = applySM2(BASE_CARD, 4)
    expect(result.next_review_at.getTime()).toBeGreaterThan(Date.now())
  })

  it('next_review_at correspond à interval_days jours dans le futur (±1 min)', () => {
    const result = applySM2(BASE_CARD, 4)
    const expectedMs = result.interval_days * 24 * 60 * 60 * 1000
    const diff = result.next_review_at.getTime() - Date.now()
    expect(diff).toBeGreaterThan(expectedMs - 60_000)
    expect(diff).toBeLessThan(expectedMs + 60_000)
  })
})

describe('GRADE_COINS', () => {
  it('grade 0 → 0 coins', () => expect(GRADE_COINS[0]).toBe(0))
  it('grade 3 → 1 coin',  () => expect(GRADE_COINS[3]).toBe(1))
  it('grade 4 → 2 coins', () => expect(GRADE_COINS[4]).toBe(2))
  it('grade 5 → 3 coins', () => expect(GRADE_COINS[5]).toBe(3))
})
