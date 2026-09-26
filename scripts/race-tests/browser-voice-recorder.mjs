/**
 * Dictee vocale de bout en bout, dans un vrai Chrome, sur la vraie page.
 *
 * browser-mic-policy.mjs verifie que l'API a le droit de demarrer.
 * Ici on verifie que la FONCTIONNALITE marche : on se connecte avec un
 * utilisateur jetable, on ouvre /courses/new, on choisit la source « Vocal »,
 * on clique sur le bouton micro, et on regarde ce que le composant fait —
 * passe-t-il en enregistrement, ou affiche-t-il « Acces au micro refuse » ?
 *
 * Chrome est lance avec un micro factice accorde d'office : sans ca, la
 * demande d'autorisation resterait ouverte et rien ne se passerait. Le micro
 * factice emet du silence, donc on ne teste pas la transcription elle-meme
 * (il faudrait vraiment parler) — on teste que la dictee DEMARRE, ce qui est
 * exactement ce que `microphone=()` empechait.
 *
 *   node scripts/race-tests/browser-voice-recorder.mjs [base]
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const BASE = process.argv[2] ?? 'https://www.skynote.fr'
const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9633 + Math.floor(Math.random() * 300)

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── 1. utilisateur jetable + cookies de session ───────────────────────────
const email = `voice-${Date.now()}@skynote-test.invalid`
const password = `Rc!${crypto.randomUUID()}`
const { data: created, error: uErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
if (uErr) throw uErr
const userId = created.user.id
// role != 'student' : /courses/new renvoie les eleves vers /dashboard
// (app/(dashboard)/courses/new/page.tsx). role null => formulaire standard,
// pas la variante enseignant.
await admin.from('profiles').upsert({ id: userId, email, plan: 'pro', role: null })

const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { data: signIn } = await anon.auth.signInWithPassword({ email, password })
const jar = new Map()
const ssr = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)),
  },
})
await ssr.auth.setSession({
  access_token: signIn.session.access_token,
  refresh_token: signIn.session.refresh_token,
})

// ── 2. Chrome, micro factice accorde d'office ─────────────────────────────
const profile = mkdtempSync(join(tmpdir(), 'skynote-voice-'))
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  'about:blank',
], { stdio: 'ignore' })

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

const ws = new WebSocket(await devtoolsUrl())
await new Promise(r => ws.once('open', r))
let msgId = 0
const pending = new Map()
const consoleLines = []
ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString())
  if (m.id !== undefined) {
    const p = pending.get(m.id)
    if (p) { pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
  } else if (m.method === 'Runtime.consoleAPICalled') {
    consoleLines.push(`${m.params.type}: ${m.params.args.map(a => a.value ?? a.description ?? '').join(' ')}`)
  }
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const msg = { id: ++msgId, method, params }
  if (sessionId) msg.sessionId = sessionId
  pending.set(msg.id, { resolve, reject })
  ws.send(JSON.stringify(msg))
})

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Runtime.enable', {}, sessionId)
await send('Page.enable', {}, sessionId)
await send('Network.enable', {}, sessionId)

const host = new URL(BASE).hostname
for (const [name, value] of jar) {
  await send('Network.setCookie', { name, value, domain: host, path: '/', secure: true }, sessionId)
}

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId)
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''))
  return r.result.value
}

// ── 3. la vraie page de creation de cours ─────────────────────────────────
await send('Page.navigate', { url: `${BASE}/courses/new` }, sessionId)
await sleep(6000)

let ok = true
const check = (label, cond, detail = '') => {
  if (!cond) ok = false
  console.log(`${cond ? '  OK  ' : 'ECHEC '} ${label}${detail ? ' — ' + detail : ''}`)
}

const page = await evaluate(`({ url: location.pathname, titre: document.title, connecte: !document.body.innerText.includes('Se connecter') || location.pathname === '/courses/new' })`)
check('page /courses/new atteinte (session valide)', page.url === '/courses/new', `url=${page.url}`)
if (page.url !== '/courses/new') {
  console.log('\n(redirige vers la connexion : les cookies n ont pas ete acceptes, test interrompu)')
  ws.close(); chrome.kill(); await sleep(500)
  try { rmSync(profile, { recursive: true, force: true }) } catch {}
  await admin.auth.admin.deleteUser(userId)
  process.exit(1)
}

// Choisir la source « Vocal », puis cliquer sur le bouton micro.
const clicked = await evaluate(`(() => {
  const byText = (re) => [...document.querySelectorAll('button')].find(b => re.test(b.textContent || ''))
  const vocal = byText(/vocal/i)
  if (!vocal) return { etape: 'onglet Vocal introuvable' }
  vocal.click()
  return { etape: 'onglet Vocal clique' }
})()`)
check('onglet « Vocal » trouve et clique', clicked.etape === 'onglet Vocal clique', clicked.etape)
await sleep(1500)

// Le bouton micro est une icone sans texte : on le cible par son aria-label,
// et on lit son aria-pressed, qui est l'etat « enregistrement » du composant.
const micResult = await evaluate(`(async () => {
  const mic = document.querySelector('button[aria-label*="dict" i], button[aria-label*="enregistrement" i]')
  if (!mic) return {
    etape: 'bouton micro introuvable',
    ariaLabels: [...document.querySelectorAll('button[aria-label]')].map(b => b.getAttribute('aria-label')).slice(0, 12),
  }
  // Lu AVANT le clic : apres, React a deja bascule le label en « Arreter ».
  const labelAvant = mic.getAttribute('aria-label')
  const pressedAvant = mic.getAttribute('aria-pressed')
  mic.click()
  await new Promise(r => setTimeout(r, 5000))
  const apres = document.body.innerText
  const courant = document.querySelector('button[aria-label*="dict" i], button[aria-label*="enregistrement" i]')
  return {
    etape: 'bouton micro clique',
    labelAvant,
    pressedAvant,
    labelApres: courant?.getAttribute('aria-label'),
    ariaPressed: courant?.getAttribute('aria-pressed'),
    texteStatut: (apres.match(/Enregistrement en cours[^\\n]*|Clique pour dicter[^\\n]*|Clique pour continuer[^\\n]*/i) || [null])[0],
    erreurMicro: /Acc(è|e)s au micro refus|Erreur microphone|reconnaissance vocale n'est pas support/i.test(apres),
    messageErreur: (apres.match(/Acc(è|e)s au micro refus[^\\n]*|Erreur microphone[^\\n]*|reconnaissance vocale n'est pas support[^\\n]*/i) || [null])[0],
  }
})()`)

check('bouton micro trouve', micResult.etape === 'bouton micro clique',
  micResult.etape === 'bouton micro clique' ? micResult.labelAvant : JSON.stringify(micResult.ariaLabels))

if (micResult.etape === 'bouton micro clique') {
  check('aucun message d erreur micro', micResult.erreurMicro === false, micResult.messageErreur ?? '')
  check('le bouton est passe en etat enregistrement', micResult.ariaPressed === 'true',
    `aria-pressed ${micResult.pressedAvant} -> ${micResult.ariaPressed}, aria-label "${micResult.labelAvant}" -> "${micResult.labelApres}"`)
  check('le statut affiche « Enregistrement en cours »',
    /Enregistrement en cours/i.test(micResult.texteStatut ?? ''), micResult.texteStatut ?? '(aucun)')
}

const policy = await evaluate(`(document.featurePolicy || document.permissionsPolicy).allowsFeature('microphone')`)
check('la politique autorise le micro sur cette page', policy === true, `allowsFeature=${policy}`)

if (consoleLines.length) {
  const pertinents = consoleLines.filter(l => /micro|speech|not-allowed|VoiceRecorder/i.test(l))
  if (pertinents.length) console.log('\nconsole :', pertinents.slice(0, 5).join(' | '))
}

console.log(`\n${ok ? '==> OK : la dictee vocale demarre sur la vraie page' : '==> ECHEC'}`)

ws.close(); chrome.kill(); await sleep(500)
try { rmSync(profile, { recursive: true, force: true }) } catch {}
await admin.auth.admin.deleteUser(userId)
console.log('(utilisateur de test supprime)')
process.exit(ok ? 0 : 1)
