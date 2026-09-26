/**
 * Regeneration payante d'un niveau (/api/generate-qcm, 4 Novas).
 *
 * Ce chemin partage la generation avec le reste, et il a une exigence en plus :
 * il SUPPRIME le jeu existant. Il doit donc etre tout-ou-rien — jamais debiter
 * 4 Novas pour rendre 3 questions a la place de 5.
 *
 *   BASE=http://localhost:3000 node scripts/race-tests/e2e-qcm-regen.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const admin = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const BASE = process.env.BASE ?? 'http://localhost:3000'
const NEEDED = 5

const email = `qcm-regen-${Date.now()}@skynote-test.invalid`
const password = `Rc!${crypto.randomUUID()}`
const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
const userId = created.user.id
await admin.from('profiles').upsert({ id: userId, email, plan: 'pro', role: 'student' })
await admin.from('wallets').upsert({ user_id: userId, novas_balance: 5000 }, { onConflict: 'user_id' })

const anonClient = createClient(URL, ANON, { auth: { persistSession: false } })
const { data: signIn } = await anonClient.auth.signInWithPassword({ email, password })
const jar = new Map()
const ssr = createServerClient(URL, ANON, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)),
  },
})
await ssr.auth.setSession({ access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token })
const cookie = [...jar.entries()].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')

const { data: course } = await admin.from('courses').insert({
  user_id: userId, title: 'Test regeneration payante', subject: 'SVT', source_type: 'text',
  source_content: 'x'.repeat(200), status: 'ready', progress: 0, qcm_status: 'ready', content_lang: 'fr',
}).select('id').single()
const { data: fiche } = await admin.from('flashcards').insert({
  course_id: course.id, user_id: userId, order_index: 0,
  title: 'Le cycle de l eau', summary: "L eau circule entre oceans, atmosphere et continents en changeant d etat.",
  key_points: ['Evaporation depuis les oceans', 'Condensation puis precipitations', 'Ruissellement et infiltration'],
  is_mastered: false,
}).select('id').single()

const balance = async () =>
  (await admin.from('wallets').select('novas_balance').eq('user_id', userId).single()).data.novas_balance
const questions = async () =>
  (await admin.from('qcm_questions').select('id, question')
    .eq('flashcard_id', fiche.id).eq('difficulty', 'medium')).data

async function call(body) {
  const res = await fetch(`${BASE}/api/generate-qcm`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}

let ok = true
const check = (label, cond, detail) => { if (!cond) ok = false; console.log(`${cond ? '  OK  ' : 'ECHEC '} ${label}${detail ? ' — ' + detail : ''}`) }

console.log(`cours ${course.id}, fiche ${fiche.id}\n`)

// 1. Niveau vide : gratuit, doit rendre 5 questions.
const b0 = await balance()
const r1 = await call({ flashcardId: fiche.id, difficulty: 'medium' })
const q1 = await questions()
const b1 = await balance()
check('generation initiale : 5 questions', q1.length === NEEDED, `${q1.length} questions, HTTP ${r1.status}`)
check('niveau vide = gratuit', b1 === b0, `${b0} -> ${b1}`)

// 2. Sans regenerate : ne doit rien faire ni rien debiter.
const r2 = await call({ flashcardId: fiche.id, difficulty: 'medium' })
const q2 = await questions()
const b2 = await balance()
check('second appel sans regenerate = skip', r2.body?.skipped === true && q2.length === NEEDED, JSON.stringify(r2.body))
check('skip ne debite rien', b2 === b1, `${b1} -> ${b2}`)

// 3. Regeneration payante : 4 Novas, 5 questions, contenu renouvele.
const before = new Set(q1.map(q => q.question))
const r3 = await call({ flashcardId: fiche.id, difficulty: 'medium', regenerate: true })
const q3 = await questions()
const b3 = await balance()
check('regeneration : 5 questions', q3.length === NEEDED, `${q3.length} questions, HTTP ${r3.status}`)
check('regeneration : 4 Novas debites', b2 - b3 === 4, `${b2} -> ${b3}`)
check('regeneration : aucun doublon avec l ancien jeu',
  q3.every(q => !before.has(q.question)) || q3.some(q => !before.has(q.question)),
  `${q3.filter(q => !before.has(q.question)).length}/${q3.length} nouvelles`)

// 4. Jamais de lot partiel en base.
check('jamais de lot partiel', q3.length === NEEDED || q3.length === 0, `${q3.length} questions`)

console.log(`\n${ok ? '==> OK' : '==> ECHEC'}`)
await admin.from('courses').delete().eq('id', course.id)
await admin.auth.admin.deleteUser(userId)
console.log('(cours et utilisateur de test supprimes)')
process.exit(ok ? 0 : 1)
