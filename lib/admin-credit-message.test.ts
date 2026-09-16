import { describe, it, expect } from 'vitest'
import { creditBadge, creditMessage, DEFAULT_CREDIT_TEXT } from './admin-credit-message'

describe('creditBadge', () => {
  it('crédit coins', () => expect(creditBadge('sky_coins', 50)).toBe('+50 Sky Coins'))
  it('crédit Novas', () => expect(creditBadge('nova', 100)).toBe('+100 Novas ✦'))
  it('retrait : signe moins, pas de "+" trompeur', () => expect(creditBadge('sky_coins', -20)).toBe('-20 Sky Coins'))
  it('singulier', () => expect(creditBadge('nova', 1)).toBe('+1 Nova ✦'))
  it('delta 0 → rien', () => expect(creditBadge('nova', 0)).toBeNull())
})

describe('creditMessage', () => {
  it('texte admin seul dans content, montant en données structurées', () => {
    expect(creditMessage('nova', 100, 'Salut')).toEqual({ content: 'Salut', applied_type: 'nova', applied_amount: 100 })
  })
  it('sans texte admin : libellé neutre', () => {
    expect(creditMessage('sky_coins', 50, '')?.content).toBe(DEFAULT_CREDIT_TEXT)
    expect(creditMessage('sky_coins', 50, undefined)?.applied_amount).toBe(50)
  })
  it('retrait conservé en négatif', () => {
    expect(creditMessage('nova', -30, 'Correction')).toEqual({ content: 'Correction', applied_type: 'nova', applied_amount: -30 })
  })
  it('delta 0 → null (pas de popup)', () => expect(creditMessage('nova', 0, 'Salut')).toBeNull())
  it('le montant ne figure jamais dans le texte', () => {
    expect(creditMessage('nova', 100, 'Salut')!.content).not.toMatch(/100|Nova/)
  })
  it('limite SQL de 2000 caractères sur content', () => {
    expect(creditMessage('nova', 5, 'x'.repeat(3000))!.content.length).toBe(2000)
  })
})
