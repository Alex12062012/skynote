// Test bout-en-bout : deux POST /api/generate CONCURRENTS sur le meme cours,
// contre le vrai serveur Next (routes, middleware, auth, Claude, Supabase).
// Verifie le nombre de fiches ecrites ET le nombre de Novas debites.
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('='))
  .map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const admin = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} })
const BASE = process.env.BASE ?? 'http://localhost:3000'
const GAP_MS = Number(process.argv[2] ?? 450)

// ── 1. utilisateur de test jetable ────────────────────────────────────────
const email = `race-test-${Date.now()}@skynote-test.invalid`
const password = `Rc!${crypto.randomUUID()}`
const { data: created, error: uErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
if (uErr) throw uErr
const userId = created.user.id
console.log(`utilisateur de test : ${email}`)

await admin.from('profiles').upsert({ id: userId, email, plan: 'free', role: 'student' })
await admin.from('wallets').upsert({ user_id: userId, novas_balance: 1000 }, { onConflict: 'user_id' })
const balBefore = (await admin.from('wallets').select('novas_balance').eq('user_id', userId).single()).data.novas_balance
console.log(`solde Novas avant : ${balBefore}`)

// ── 2. cookies de session, derives par @supabase/ssr lui-meme ─────────────
const anonClient = createClient(URL, ANON, { auth:{persistSession:false} })
const { data: signIn, error: sErr } = await anonClient.auth.signInWithPassword({ email, password })
if (sErr) throw sErr

const jar = new Map()
const ssr = createServerClient(URL, ANON, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
  },
})
await ssr.auth.setSession({ access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token })
const cookieHeader = [...jar.entries()].map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
console.log(`cookies de session : ${[...jar.keys()].join(', ')}`)

// ── 3. cours de test ──────────────────────────────────────────────────────
const { data: course } = await admin.from('courses').insert({
  user_id: userId, title: 'La photosynthese', subject: 'SVT', source_type: 'text',
  source_content: "La photosynthese est le processus par lequel les plantes vertes utilisent l'energie lumineuse pour convertir le dioxyde de carbone et l'eau en glucose et en dioxygene. Elle se deroule dans les chloroplastes, grace a la chlorophylle. On distingue la phase claire, qui capte la lumiere et produit ATP et NADPH, et le cycle de Calvin, qui fixe le carbone. La photosynthese est a la base de presque toutes les chaines alimentaires.",
  status: 'processing', progress: 0, content_lang: 'fr',
}).select('id').single()
console.log(`cours de test : ${course.id}\n`)

// ── 4. DEUX requetes concurrentes, comme CreateCourseForm + GenerationTrigger
const post = async (n) => {
  await new Promise(r => setTimeout(r, (n-1)*GAP_MS))
  const t0 = Date.now()
  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ courseId: course.id }),
  })
  const body = await res.json().catch(() => ({}))
  console.log(`  [req${n}] ${res.status} ${JSON.stringify(body)}  (+${Date.now()-t0}ms)`)
}
console.log(`--- 2 POST /api/generate a ${GAP_MS} ms d'ecart ---`)
await Promise.all([post(1), post(2)])

// ── 5. attendre la fin de la generation en tache de fond ──────────────────
console.log('\nattente de la fin du pipeline...')
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 2000))
  const { data: c } = await admin.from('courses').select('status').eq('id', course.id).single()
  if (c.status === 'ready' || c.status === 'error') { console.log(`statut final : ${c.status}`); break }
}
await new Promise(r => setTimeout(r, 3000))

// ── 6. verdict ────────────────────────────────────────────────────────────
const { data: fc } = await admin.from('flashcards').select('title, order_index, created_at').eq('course_id', course.id).order('created_at')
const stamps = new Set(fc.map(f => f.created_at))
const { data: tx } = await admin.from('nova_transactions').select('amount, reason').eq('user_id', userId)
const balAfter = (await admin.from('wallets').select('novas_balance').eq('user_id', userId).single()).data.novas_balance
const { count: lockCount } = await admin.from('generation_locks').select('lock_key',{count:'exact',head:true}).eq('lock_key', `course:${course.id}:flashcards`)

console.log(`\n───────────────────────────── RESULTAT ─────────────────────────────`)
console.log(`fiches en base        : ${fc.length}   (attendu <= 4)`)
console.log(`instructions INSERT   : ${stamps.size}   (attendu 1)`)
fc.forEach(f => console.log(`   [${f.order_index}] ${f.title}`))
console.log(`transactions Novas    : ${tx.length}`)
tx.forEach(t => console.log(`   ${t.amount}  ${t.reason}`))
console.log(`solde ${balBefore} -> ${balAfter}  (debit total ${balBefore-balAfter}, attendu 118)`)
console.log(`bail restant en base  : ${lockCount}   (attendu 0 — libere en fin de pipeline)`)
const ok = fc.length <= 4 && stamps.size === 1 && (balBefore-balAfter) === 118 && lockCount === 0
console.log(ok ? '\n==> OK' : '\n==> ECHEC')

// ── 7. menage ─────────────────────────────────────────────────────────────
await admin.from('courses').delete().eq('id', course.id)
await admin.rpc('release_generation_lock', { p_lock_key: `course:${course.id}:flashcards` })
await admin.auth.admin.deleteUser(userId)
console.log('(utilisateur et cours de test supprimes)')
process.exit(ok ? 0 : 1)
