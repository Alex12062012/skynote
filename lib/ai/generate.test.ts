import { describe, it, expect, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))

import {
  hasLengthBias,
  validateGeneratedQuestions,
  QCM_QUESTIONS_PER_FLASHCARD,
  type GeneratedQuestion,
} from './generate'

function q(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    question: 'Quelle est la capitale de la France ?',
    options: ['Paris', 'Lyon', 'Marseille', 'Bordeaux'],
    correct_index: 0,
    explanation: 'Paris est la capitale.',
    ...overrides,
  }
}

const N = QCM_QUESTIONS_PER_FLASHCARD
const good = () => Array.from({ length: N }, () => q())

// ─── hasLengthBias ────────────────────────────────────────────────────────────
describe('hasLengthBias', () => {
  it("l'exemple du brief : bonne réponse 2× plus longue → biais", () => {
    expect(hasLengthBias({
      options: [
        "Elle s'infiltre dans le sol, puis rejoint les nappes phréatiques ou ruisselle vers les rivières",
        'Elle repart aussitôt en évaporation',
        'Elle gèle',
        'Elle disparaît',
      ],
      correct_index: 0,
    })).toBe(true)
  })

  it('distracteur enrichi → plus de biais', () => {
    expect(hasLengthBias({
      options: [
        "Elle s'infiltre dans le sol, puis rejoint les nappes phréatiques",
        'Elle repart aussitôt en évaporation, car la chaleur résiduelle du sol la réchauffe',
        'Elle gèle',
        'Elle disparaît',
      ],
      correct_index: 0,
    })).toBe(false)
  })

  it('réponses courtes (dates, noms) : jamais biaisées', () => {
    expect(hasLengthBias({ options: ['1789', '1791', '1804', '1815'], correct_index: 0 })).toBe(false)
    expect(hasLengthBias({ options: ['Le noyau de la cellule', 'Le', 'La', 'Un'], correct_index: 0 })).toBe(true)
    expect(hasLengthBias({ options: ['Le noyau', 'Le', 'La', 'Un'], correct_index: 0 })).toBe(false)
  })

  it('écart inférieur au seuil → pas de biais', () => {
    expect(hasLengthBias({
      options: ['un deux trois quatre cinq', 'un deux trois quatre', 'un deux trois quatre', 'un deux trois quatre'],
      correct_index: 0,
    })).toBe(false)
  })

  it('comparaison au distracteur le plus long, pas à la moyenne', () => {
    // 8 mots vs [8, 1, 1] : la moyenne (3.3) crierait au biais, le plus long non.
    expect(hasLengthBias({
      options: ['a b c d e f g h', 'a b c d e f g h', 'a', 'a'],
      correct_index: 0,
    })).toBe(false)
  })
})

// ─── validateGeneratedQuestions ───────────────────────────────────────────────
describe('validateGeneratedQuestions', () => {
  it(`${N} questions saines → valide`, () => {
    const r = validateGeneratedQuestions(good(), N, 'easy')
    expect(r.valid).toBe(true)
    expect(r.questions).toHaveLength(N)
  })

  it('tableau vide → invalide', () => {
    const r = validateGeneratedQuestions([], N, 'easy')
    expect(r.valid).toBe(false)
    expect(r.questions).toHaveLength(0)
  })

  it('questions en trop → tronquées à expectedCount', () => {
    const r = validateGeneratedQuestions([...good(), q(), q()], N, 'easy')
    expect(r.valid).toBe(true)
    expect(r.questions).toHaveLength(N)
  })

  it('option vide → question écartée → invalide si plus assez', () => {
    const r = validateGeneratedQuestions([...good().slice(1), q({ options: ['Paris', '', 'Lyon', 'Nice'] })], N, 'easy')
    expect(r.valid).toBe(false)
    expect(r.questions).toHaveLength(N - 1)
    if (!r.valid) expect(r.reason).toContain('option vide')
  })

  it('correct_index hors bornes → écartée', () => {
    const r = validateGeneratedQuestions([...good().slice(1), q({ correct_index: 4 })], N, 'easy')
    expect(r.valid).toBe(false)
    if (!r.valid) expect(r.reason).toContain('correct_index')
  })

  it('explication vide → écartée', () => {
    const r = validateGeneratedQuestions([...good().slice(1), q({ explanation: '' })], N, 'medium')
    expect(r.valid).toBe(false)
  })

  const biased = () => q({
    options: [
      "Elle s'infiltre dans le sol, puis rejoint les nappes phréatiques ou ruisselle vers les rivières",
      'Elle repart en évaporation',
      'Elle gèle',
      'Elle disparaît',
    ],
    correct_index: 0,
  })

  it('biais de longueur → écartée en Normal et Hardcore', () => {
    for (const d of ['easy', 'medium'] as const) {
      const r = validateGeneratedQuestions([...good().slice(1), biased()], N, d)
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toContain('biais de longueur')
    }
  })

  it('biais de longueur ignoré en Paisible', () => {
    const r = validateGeneratedQuestions([...good().slice(1), biased()], N, 'peaceful')
    expect(r.valid).toBe(true)
  })

  it('questions saines conservées même quand le lot est invalide (mode dégradé)', () => {
    const r = validateGeneratedQuestions([q(), q({ explanation: '' })], N, 'easy')
    expect(r.valid).toBe(false)
    expect(r.questions).toHaveLength(1)
  })
})
