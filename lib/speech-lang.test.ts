import { describe, it, expect } from 'vitest'
import { toSpeechLang, pickVoice } from './speech-lang'

function voice(p: Partial<SpeechSynthesisVoice>): SpeechSynthesisVoice {
  return { name: 'x', lang: 'fr-FR', localService: true, default: false, voiceURI: 'x', ...p } as SpeechSynthesisVoice
}

describe('toSpeechLang', () => {
  it('code produit → BCP 47', () => {
    expect(toSpeechLang('fr')).toBe('fr-FR')
    expect(toSpeechLang('en')).toBe('en-US')
    expect(toSpeechLang('ja')).toBe('ja-JP')
  })
  it('tag BCP 47 déjà formé → inchangé', () => expect(toSpeechLang('pt-BR')).toBe('pt-BR'))
  it('auto / null / inconnu → une langue supportée, jamais vide', () => {
    for (const v of ['auto', null, undefined, 'xx']) expect(toSpeechLang(v)).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
  })
})

describe('pickVoice', () => {
  it('préfère la voix réseau « Google » à la voix locale de l’OS', () => {
    const local = voice({ name: 'Microsoft Hortense', lang: 'fr-FR', localService: true, default: true })
    const google = voice({ name: 'Google français', lang: 'fr-FR', localService: false })
    expect(pickVoice([local, google], 'fr-FR')).toBe(google)
  })
  it('exacte > même langue autre région > rien', () => {
    const ca = voice({ name: 'Amélie', lang: 'fr-CA' })
    const fr = voice({ name: 'Thomas', lang: 'fr-FR' })
    const en = voice({ name: 'Daniel', lang: 'en-GB' })
    expect(pickVoice([en, ca, fr], 'fr-FR')).toBe(fr)
    expect(pickVoice([en, ca], 'fr-FR')).toBe(ca)
    expect(pickVoice([en], 'fr-FR')).toBeNull()
  })
  it('une fiche en anglais ne prend jamais une voix française', () => {
    const fr = voice({ name: 'Google français', lang: 'fr-FR', localService: false })
    const en = voice({ name: 'Daniel', lang: 'en-GB' })
    expect(pickVoice([fr, en], 'en-US')).toBe(en)
  })
})
