/**
 * Verifie DANS UN VRAI CHROME que le site a le droit d'utiliser le micro.
 *
 * Pourquoi ce test et pas un simple `curl -I` : l'en-tete Permissions-Policy
 * n'est pas une declaration decorative, c'est le navigateur qui l'applique.
 * Lire l'en-tete prouve qu'on l'a change ; seul un navigateur prouve que la
 * dictee vocale peut effectivement demarrer.
 *
 * Trois choses mesurees, dans l'ordre de ce qui casse :
 *   1. l'en-tete reellement reçu par le navigateur ;
 *   2. `document.featurePolicy.allowsFeature('microphone')` — le verdict de la
 *      Permissions Policy, ce que `microphone=()` met a false ;
 *   3. un vrai `SpeechRecognition.start()` : avec micro factice auto-autorise,
 *      un refus de POLITIQUE se voit immediatement (`not-allowed`), alors
 *      qu'une politique correcte laisse la reconnaissance demarrer.
 *
 * Pilote le Chrome installe via le DevTools Protocol (pas de dependance
 * supplementaire : `ws` est deja dans node_modules).
 *
 *   node scripts/race-tests/browser-mic-policy.mjs [url]
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'

const URL_TO_TEST = process.argv[2] ?? 'https://www.skynote.fr/login'
const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333 + Math.floor(Math.random() * 300)
const profile = mkdtempSync(join(tmpdir(), 'skynote-mic-'))

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  // Micro factice accorde d'office : on veut isoler la Permissions Policy,
  // pas se faire bloquer par une demande d'autorisation utilisateur.
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function devtoolsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (r.ok) return (await r.json()).webSocketDebuggerUrl
    } catch {}
    await sleep(500)
  }
  throw new Error('Chrome n a pas ouvert son port de debug')
}

function cdp(ws) {
  let id = 0
  const pending = new Map()
  const events = []
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString())
    if (m.id !== undefined) {
      const p = pending.get(m.id)
      if (p) { pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
    } else {
      events.push(m)
    }
  })
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const msg = { id: ++id, method, params }
    if (sessionId) msg.sessionId = sessionId
    pending.set(msg.id, { resolve, reject })
    ws.send(JSON.stringify(msg))
  })
  return { send, events }
}

const ws = new WebSocket(await devtoolsUrl())
await new Promise(r => ws.once('open', r))
const { send } = cdp(ws)

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Network.enable', {}, sessionId)
await send('Page.enable', {}, sessionId)

// On capte l'en-tete tel que le navigateur le reçoit.
let policyHeader = null
ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString())
  if (m.method === 'Network.responseReceived' && m.params?.response?.url?.startsWith(URL_TO_TEST.split('?')[0])) {
    const h = m.params.response.headers
    policyHeader = h['permissions-policy'] ?? h['Permissions-Policy'] ?? policyHeader
  }
})

await send('Page.navigate', { url: URL_TO_TEST }, sessionId)
await sleep(4000)

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId)
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''))
  return r.result.value
}

const verdict = await evaluate(`(async () => {
  const fp = document.featurePolicy || document.permissionsPolicy
  const out = {
    url: location.href,
    origine: location.origin,
    politiqueMicro: fp ? fp.allowsFeature('microphone') : 'API featurePolicy indisponible',
    politiqueCamera: fp ? fp.allowsFeature('camera') : null,
    politiqueGeo: fp ? fp.allowsFeature('geolocation') : null,
    apiSpeechPresente: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  }
  try {
    out.permissionMicro = (await navigator.permissions.query({ name: 'microphone' })).state
  } catch (e) { out.permissionMicro = 'inconnue: ' + e.message }

  // Demarrage reel de la reconnaissance vocale, comme VoiceRecorder.tsx.
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { out.speech = 'API absente de ce build'; return out }
  out.speech = await new Promise((resolve) => {
    let settled = false
    const done = (v) => { if (!settled) { settled = true; resolve(v) } }
    try {
      const r = new SR()
      r.lang = 'fr-FR'; r.continuous = true; r.interimResults = true
      r.onerror = (e) => done('onerror: ' + e.error)
      r.onstart = () => done('onstart (la reconnaissance a demarre)')
      r.onend = () => done('onend sans onstart')
      r.start()
      setTimeout(() => done('aucun evenement en 8 s'), 8000)
    } catch (e) { done('exception a start(): ' + e.name + ' ' + e.message) }
  })
  return out
})()`)

console.log(`\nURL testee : ${URL_TO_TEST}`)
console.log(`En-tete Permissions-Policy reçu par Chrome :\n  ${policyHeader ?? '(non capte)'}\n`)
console.log('Verdict du navigateur :')
for (const [k, v] of Object.entries(verdict)) console.log(`  ${k.padEnd(20)} ${v}`)

const micOk = verdict.politiqueMicro === true
const speechBlockedByPolicy = String(verdict.speech).includes('not-allowed')
console.log(`\n${micOk ? '  OK  ' : 'ECHEC '} la politique autorise le micro pour le site`)
console.log(`${speechBlockedByPolicy ? 'ECHEC ' : '  OK  '} la reconnaissance vocale n est pas bloquee par la politique`)

ws.close()
chrome.kill()
await sleep(500)
try { rmSync(profile, { recursive: true, force: true }) } catch {}
process.exit(micOk && !speechBlockedByPolicy ? 0 : 1)
