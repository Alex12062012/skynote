// Reproduction du double-insert : deux "processCourse" concurrents sur le meme cours.
// Rejoue exactement la sequence du code (SELECT count -> [latence IA] -> INSERT),
// sans appeler Claude. Nettoie tout derriere lui.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const MODE = process.argv[2] ?? 'legacy'   // legacy | claim
const LATENCY_MS = Number(process.argv[3] ?? 1500) // latence de l'appel Claude simulee
const GAP_MS = Number(process.argv[4] ?? 450)      // ecart reel mesure en prod (453 ms)
const WORKERS = Number(process.argv[5] ?? 2)       // nombre de requetes concurrentes

const { data: anyCourse } = await db.from('courses').select('user_id').limit(1).single()
const userId = anyCourse.user_id

const { data: course, error: cErr } = await db.from('courses').insert({
  user_id: userId,
  title: `__RACE_TEST__ ${new Date().toISOString()}`,
  subject: 'Test',
  source_type: 'text',
  source_content: 'Contenu de test suffisamment long pour passer la validation du pipeline.',
  status: 'processing',
  progress: 0,
}).select('id').single()
if (cErr) throw cErr
const courseId = course.id
console.log(`cours de test : ${courseId}  (mode=${MODE}, latence IA=${LATENCY_MS}ms, ecart=${GAP_MS}ms)`)

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// --- La garde telle qu'elle est aujourd'hui dans processCourse ---
async function legacyGuard(worker) {
  const { count } = await db.from('flashcards').select('id', { count: 'exact' }).eq('course_id', courseId)
  console.log(`  [w${worker}] count existant = ${count}`)
  if ((count ?? 0) > 0) return { worker, ran: false, reason: 'garde count>0' }
  return { worker, ran: true }
}

// --- La garde corrigee : bail atomique PUIS lecture SOUS le bail ---
// L'ordre est le coeur du correctif. Une lecture faite avant la prise du bail
// est deja perimee quand on ecrit : la requete qui obtient le bail en second
// travaillerait sur un etat d'avant l'insertion de la premiere.
async function claimGuard(worker) {
  const { data, error } = await db.rpc('try_acquire_generation_lock', {
    p_lock_key: `course:${courseId}:flashcards`, p_user_id: userId, p_ttl_seconds: 120,
  })
  if (error) return { worker, ran: false, reason: `rpc error: ${error.message}` }
  console.log(`  [w${worker}] bail accorde = ${data}`)
  if (!data) return { worker, ran: false, reason: 'bail deja pris' }

  const { count } = await db.from('flashcards').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
  console.log(`  [w${worker}] count lu SOUS le bail = ${count}`)
  if ((count ?? 0) > 0) {
    await db.rpc('release_generation_lock', { p_lock_key: `course:${courseId}:flashcards` })
    return { worker, ran: false, reason: 'deja genere (vu sous le bail)' }
  }
  return { worker, ran: true, release: true }
}

async function worker(n) {
  await sleep((n - 1) * GAP_MS)                    // requetes echelonnees de GAP_MS
  const guard = MODE === 'claim' ? claimGuard : legacyGuard
  const g = await guard(n)
  if (!g.ran) { console.log(`  [w${n}] arrete : ${g.reason}`); return g }
  await sleep(LATENCY_MS)                          // appel Claude
  const rows = [0, 1, 2, 3].map(i => ({
    course_id: courseId, user_id: userId,
    title: `w${n}-fiche-${i}`, summary: 's', key_points: ['a', 'b', 'c'],
    is_mastered: false, order_index: i,
  }))
  const { error } = await db.from('flashcards').insert(rows)
  console.log(`  [w${n}] INSERT 4 fiches -> ${error ? 'REFUSE: ' + error.message : 'OK'}`)
  if (g.release) await db.rpc('release_generation_lock', { p_lock_key: `course:${courseId}:flashcards` })
  return { worker: n, ran: true, inserted: !error, err: error?.message }
}

console.log(`--- ${WORKERS} requetes concurrentes ---`)
const res = await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i + 1)))

const { data: final } = await db.from('flashcards').select('title, order_index, created_at')
  .eq('course_id', courseId).order('created_at')
const stamps = new Set(final.map(f => f.created_at))
console.log(`\nRESULTAT: ${final.length} fiches en base, ${stamps.size} instruction(s) INSERT distincte(s)`)
console.log(final.map(f => `   ${f.order_index}  ${f.title}`).join('\n'))
console.log(final.length === 4 ? '\n==> OK : une seule generation a abouti' : `\n==> BUG : ${final.length} fiches au lieu de 4`)

await db.from('flashcards').delete().eq('course_id', courseId)
await db.from('courses').delete().eq('id', courseId)
console.log('(cours de test supprime)')
