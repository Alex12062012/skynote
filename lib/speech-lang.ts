/**
 * Langue des APIs Web Speech (dictée STT + lecture TTS), partagée par
 * VoiceRecorder et SpeakButton.
 *
 * Le produit stocke la langue des fiches sous forme de code court
 * (CONTENT_LANGUAGES : 'fr', 'en', … ou 'auto'). Les APIs du navigateur
 * attendent un tag BCP 47 ('fr-FR'). Ce module fait la conversion et choisit
 * la meilleure voix de synthèse disponible pour une langue donnée.
 */

const BCP47: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  ar: 'ar-SA',
  ja: 'ja-JP',
  zh: 'zh-CN',
}

export const DEFAULT_SPEECH_LANG = 'fr-FR'

/**
 * Code court du produit → tag BCP 47. `auto`, vide ou inconnu → langue du
 * navigateur si elle fait partie des langues supportées, sinon fr-FR.
 */
export function toSpeechLang(code?: string | null): string {
  if (code && code !== 'auto') {
    if (BCP47[code]) return BCP47[code]
    if (/^[a-z]{2}-[A-Z]{2}$/.test(code)) return code
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    const base = navigator.language.slice(0, 2).toLowerCase()
    if (BCP47[base]) return navigator.language.length >= 5 ? navigator.language : BCP47[base]
  }
  return DEFAULT_SPEECH_LANG
}

/** Mots-clés qui signalent une voix réseau / neuronale, nettement plus naturelle. */
const PREMIUM_HINTS = ['google', 'natural', 'neural', 'premium', 'enhanced', 'online', 'siri']

function voiceScore(v: SpeechSynthesisVoice, lang: string): number {
  const vl = v.lang.toLowerCase().replace('_', '-')
  const target = lang.toLowerCase()
  let score = 0
  if (vl === target) score += 100
  else if (vl.startsWith(target.slice(0, 2))) score += 60
  else return -1
  // Les voix réseau (localService=false) sont généralement les plus naturelles.
  if (!v.localService) score += 20
  const name = v.name.toLowerCase()
  if (PREMIUM_HINTS.some((h) => name.includes(h))) score += 15
  if (v.default) score += 5
  return score
}

/**
 * Meilleure voix pour `lang` parmi `voices`, ou null si aucune ne correspond
 * (le navigateur choisira alors sa voix par défaut pour `utterance.lang`).
 */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -1
  for (const v of voices) {
    const s = voiceScore(v, lang)
    if (s > bestScore) { best = v; bestScore = s }
  }
  return best
}

/**
 * `speechSynthesis.getVoices()` renvoie souvent [] au premier appel : la liste
 * se remplit de façon asynchrone (événement `voiceschanged`). Résout dès que
 * des voix sont disponibles, ou après `timeoutMs` avec ce qu'il y a.
 */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve([])
    const synth = window.speechSynthesis
    const initial = synth.getVoices()
    if (initial.length > 0) return resolve(initial)

    let done = false
    const finish = () => {
      if (done) return
      done = true
      synth.removeEventListener('voiceschanged', finish)
      resolve(synth.getVoices())
    }
    synth.addEventListener('voiceschanged', finish)
    setTimeout(finish, timeoutMs)
  })
}
