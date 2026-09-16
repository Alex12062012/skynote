import { describe, it, expect } from 'vitest'
import { creditLine, creditMessageContent } from './admin-credit-message'

describe('creditLine', () => {
  it('crédit coins', () => expect(creditLine('sky_coins', 50)).toBe('+50 Sky Coins ajoutés à ton compte.'))
  it('crédit Novas', () => expect(creditLine('nova', 100)).toBe('+100 Novas ✦ ajoutés à ton compte.'))
  it('retrait : pas de "+" trompeur', () => expect(creditLine('sky_coins', -20)).toBe('-20 Sky Coins retirés de ton compte.'))
  it('singulier', () => expect(creditLine('nova', 1)).toBe('+1 Nova ✦ ajouté à ton compte.'))
  it('delta 0 → rien', () => expect(creditLine('nova', 0)).toBeNull())
})

describe('creditMessageContent', () => {
  it('texte admin + saut de ligne + ligne générée', () => {
    expect(creditMessageContent('nova', 100, 'Salut')).toBe('Salut\n+100 Novas ✦ ajoutés à ton compte.')
  })
  it('sans texte admin : ligne générée seule', () => {
    expect(creditMessageContent('sky_coins', 50, '')).toBe('+50 Sky Coins ajoutés à ton compte.')
    expect(creditMessageContent('sky_coins', 50, undefined)).toBe('+50 Sky Coins ajoutés à ton compte.')
  })
  it('montant réellement appliqué (retrait tronqué par le solde)', () => {
    expect(creditMessageContent('nova', -30, 'Correction')).toBe('Correction\n-30 Novas ✦ retirés de ton compte.')
  })
  it('delta 0 → null (pas de popup)', () => expect(creditMessageContent('nova', 0, 'Salut')).toBeNull())
  it('respecte la limite SQL de 2000 caractères', () => {
    const c = creditMessageContent('nova', 5, 'x'.repeat(3000))!
    expect(c.length).toBeLessThanOrEqual(2000)
    expect(c.endsWith('+5 Novas ✦ ajoutés à ton compte.')).toBe(true)
  })
})
