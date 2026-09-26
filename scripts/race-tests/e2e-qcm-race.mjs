// Test bout-en-bout du cote QCM : trois vagues concurrentes de /api/generate-qcm/level
// sur le meme (cours, niveau) — exactement ce qui a produit 10 questions par fiche
// au lieu de 5 le 21/09 (deux vagues completes des 3 niveaux).
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('='))
  .map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const admin = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} })
const BASE = process.env.BASE ?? 'http://localhost:3000'
const WAVES = Number(process.argv[2] ?? 3)

const email = `qcm-race-${Date.now()}@skynote-test.invalid`
const password = `Rc!${crypto.randomUUID()}`
const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
const userId = created.user.id
await admin.from('profiles').upsert({ id: userId, email, plan: 'pro', role: 'student' })
await admin.from('wallets').upsert({ user_id: userId, novas_balance: 5000 }, { onConflict: 'user_id' })

const anonClient = createClient(URL, ANON, { auth:{persistSession:false} })
const { data: signIn } = await anonClient.auth.signInWithPassword({ email, password })
const jar = new Map()
const ssr = createServerClient(URL, ANON, { cookies: {
  getAll: () => [...jar.entries()].map(([name,value])=>({name,value})),
  setAll: (l) => l.forEach(({name,value})=>jar.set(name,value)) } })
await ssr.auth.setSession({ access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token })
const cookieHeader = [...jar.entries()].map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('; ')

// Cours DEJA pret avec ses fiches : on teste uniquement l'etape QCM.
const { data: course } = await admin.from('courses').insert({
  user_id: userId, title: 'La photosynthese', subject: 'SVT', source_type: 'text',
  source_content: 'x'.repeat(200), status: 'ready', progress: 0, qcm_status: 'processing', content_lang: 'fr',
}).select('id').single()
await admin.from('flashcards').insert([0,1,2].map(i => ({
  course_id: course.id, user_id: userId, order_index: i,
  title: ['La phase claire','Le cycle de Calvin','Le role des chloroplastes'][i],
  summary: 'Resume de la fiche pour le test.', key_points: ['point un','point deux','point trois'],
  is_mastered: false,
})))
console.log(`cours de test : ${course.id}  (3 fiches, ${WAVES} vagues concurrentes par niveau)\n`)

const post = async (difficulty, wave) => {
  const res = await fetch(`${BASE}/api/generate-qcm/level`, {
    method: 'POST', headers: { 'Content-Type':'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ courseId: course.id, difficulty }),
  })
  const b = await res.json().catch(()=>({}))
  console.log(`  [${difficulty} vague${wave}] ${res.status} ${JSON.stringify(b)}`)
}
const levels = ['peaceful','easy','medium']
await Promise.all(levels.flatMap(d => Array.from({length:WAVES},(_,w)=>post(d,w+1))))

const { data: q } = await admin.from('qcm_questions')
  .select('flashcard_id, difficulty, created_at').eq('course_id', course.id)
const byKey = new Map()
for (const r of q) {
  const k = `${r.flashcard_id}|${r.difficulty}`
  const e = byKey.get(k) ?? { n:0, ts:new Set() }
  e.n++; e.ts.add(r.created_at); byKey.set(k, e)
}
console.log(`\n───────────────────────────── RESULTAT ─────────────────────────────`)
console.log(`questions au total : ${q.length}`)
let bad = 0
for (const [k,v] of byKey) {
  const flag = v.n > 5 || v.ts.size > 1
  if (flag) bad++
  console.log(`${flag?' DOUBLON':'   OK   '}  ${k.split('|')[1].padEnd(9)} ${v.n} questions / ${v.ts.size} INSERT`)
}
const { count: locks } = await admin.from('generation_locks').select('lock_key',{count:'exact',head:true}).like('lock_key',`course:${course.id}:%`)
console.log(`baux restants : ${locks} (attendu 0)`)
console.log(bad === 0 && locks === 0 ? '\n==> OK : aucun doublon' : `\n==> ECHEC : ${bad} couple(s) (fiche, niveau) en double`)

await admin.from('courses').delete().eq('id', course.id)
for (const d of levels) await admin.rpc('release_generation_lock',{p_lock_key:`course:${course.id}:qcm:${d}`})
await admin.auth.admin.deleteUser(userId)
console.log('(utilisateur et cours de test supprimes)')
