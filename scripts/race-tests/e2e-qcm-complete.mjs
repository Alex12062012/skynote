/**
 * Test de COMPLETUDE (et non plus de concurrence) : N cours jetables de 4
 * fiches, generation des 3 niveaux comme le fait QcmGenerator, puis on verifie
 * que chaque couple (fiche, niveau) a bien ses 5 questions.
 *
 *   BASE=http://localhost:3000 node scripts/race-tests/e2e-qcm-complete.mjs 3
 *   BASE=https://www.skynote.fr node scripts/race-tests/e2e-qcm-complete.mjs 3
 *
 * Nettoie ses cours et son utilisateur a la fin.
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
const COURSES = Number(process.argv[2] ?? 3)
const LEVELS = ['peaceful', 'easy', 'medium']
const NEEDED = 5

const FICHES = [
  { title: 'Le cycle de Calvin', summary: "Phase de la photosynthese qui fixe le carbone, dans le stroma du chloroplaste.", key_points: ['Se deroule dans le stroma a partir du CO2', 'Utilise ATP et NADPH de la phase claire', 'Produit du glucose'] },
  { title: 'Evolution des premiers hommes', summary: "Le genre Homo apparait en Afrique il y a 3 millions d annees, marque par l outil.", key_points: ['Homo habilis taille la pierre', 'Homo erectus maitrise le feu', 'Homo sapiens il y a 300 000 ans'] },
  { title: 'Le theoreme de Pythagore', summary: "Dans un triangle rectangle, le carre de l hypotenuse egale la somme des carres des cotes.", key_points: ['Triangles rectangles uniquement', 'Hypotenuse au carre = somme des carres', 'La reciproque prouve l angle droit'] },
  { title: 'La Ve Republique', summary: "Instauree en 1958 par de Gaulle, elle renforce l executif.", key_points: ['Constitution de 1958 par referendum', 'President elu au suffrage direct depuis 1962', 'Premier ministre nomme par le President'] },
]

// ── utilisateur jetable + cookies de session ──────────────────────────────
const email = `qcm-complete-${Date.now()}@skynote-test.invalid`
const password = `Rc!${crypto.randomUUID()}`
const { data: created, error: uErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
if (uErr) throw uErr
const userId = created.user.id
await admin.from('profiles').upsert({ id: userId, email, plan: 'pro', role: 'student' })
await admin.from('wallets').upsert({ user_id: userId, novas_balance: 20000 }, { onConflict: 'user_id' })

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

console.log(`cible ${BASE} — ${COURSES} cours x 4 fiches x 3 niveaux\n`)

const courseIds = []
for (let c = 0; c < COURSES; c++) {
  const { data: course } = await admin.from('courses').insert({
    user_id: userId, title: `Test completude ${c + 1}`, subject: 'SVT', source_type: 'text',
    source_content: 'x'.repeat(200), status: 'ready', progress: 0, qcm_status: 'processing', content_lang: 'fr',
  }).select('id').single()
  await admin.from('flashcards').insert(FICHES.map((f, i) => ({
    course_id: course.id, user_id: userId, order_index: i,
    title: f.title, summary: f.summary, key_points: f.key_points, is_mastered: false,
  })))
  courseIds.push(course.id)
}

// ── ce que fait QcmGenerator : 3 niveaux en parallele, jusqu'a 3 passages ──
async function generateCourse(courseId, label) {
  const state = {}
  for (let pass = 1; pass <= 3; pass++) {
    const todo = LEVELS.filter(l => !state[l]?.complete)
    if (todo.length === 0) break
    await Promise.allSettled(todo.map(async (difficulty) => {
      const t0 = Date.now()
      const res = await fetch(`${BASE}/api/generate-qcm/level`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ courseId, difficulty }),
      })
      const d = await res.json().catch(() => ({}))
      state[difficulty] = d
      console.log(`  ${label} p${pass} ${difficulty.padEnd(9)} ${res.status} complete=${d.complete} fiches=${d.fiches}/${d.fichesTotal} tours=${d.rounds} ${((Date.now() - t0) / 1000).toFixed(1)}s`)
    }))
  }
}

const t0 = Date.now()
for (const [i, id] of courseIds.entries()) await generateCourse(id, `cours${i + 1}`)
console.log(`\npasses navigateur terminees en ${((Date.now() - t0) / 1000).toFixed(0)}s`)

// ── Phase 2 : on laisse le reconciliateur serveur finir ───────────────────
// C'est la vraie garantie. Le navigateur fait au mieux et peut etre bloque
// (plafond 40 QCM/h par utilisateur, onglet ferme, requete tuee) ; le cron
// termine le travail sans lui. WAIT_MINUTES=0 pour ne tester que le navigateur.
const WAIT_MINUTES = Number(process.env.WAIT_MINUTES ?? 12)
const EXPECTED = courseIds.length * FICHES.length * LEVELS.length

async function countComplete() {
  const { data } = await admin.from('qcm_questions')
    .select('course_id, flashcard_id, difficulty').in('course_id', courseIds)
  const c = new Map()
  for (const q of data) {
    const k = `${q.course_id}|${q.flashcard_id}|${q.difficulty}`
    c.set(k, (c.get(k) ?? 0) + 1)
  }
  let ok = 0
  for (const v of c.values()) if (v >= NEEDED) ok++
  return ok
}

if (WAIT_MINUTES > 0) {
  const deadline = Date.now() + WAIT_MINUTES * 60_000
  let last = -1
  while (Date.now() < deadline) {
    const ok = await countComplete()
    if (ok !== last) {
      console.log(`  reconciliation serveur : ${ok}/${EXPECTED} couples complets (+${((Date.now() - t0) / 1000).toFixed(0)}s)`)
      last = ok
    }
    if (ok >= EXPECTED) break
    await new Promise(r => setTimeout(r, 20_000))
  }
}
console.log(`\ntotal ${((Date.now() - t0) / 1000).toFixed(0)}s`)

// ── verdict lu en base, pas dans les reponses HTTP ────────────────────────
const { data: qs } = await admin.from('qcm_questions')
  .select('course_id, flashcard_id, difficulty').in('course_id', courseIds)
const counts = new Map()
for (const q of qs) {
  const k = `${q.course_id}|${q.flashcard_id}|${q.difficulty}`
  counts.set(k, (counts.get(k) ?? 0) + 1)
}

let complets = 0, manquants = 0, malDimensionnes = 0
for (const cid of courseIds) {
  const { data: fcs } = await admin.from('flashcards').select('id, title').eq('course_id', cid).order('order_index')
  for (const f of fcs) for (const l of LEVELS) {
    const n = counts.get(`${cid}|${f.id}|${l}`) ?? 0
    if (n === NEEDED) complets++
    else if (n === 0) { manquants++; console.log(`  MANQUE  ${l.padEnd(9)} "${f.title}"`) }
    else { malDimensionnes++; console.log(`  PARTIEL ${l.padEnd(9)} "${f.title}" -> ${n}/${NEEDED}`) }
  }
}

const total = complets + manquants + malDimensionnes
console.log(`\n───────────────────── RESULTAT ─────────────────────`)
console.log(`couples (fiche, niveau) : ${total}`)
console.log(`  complets a ${NEEDED}/5 : ${complets}  (${(100 * complets / total).toFixed(1)} %)`)
console.log(`  partiels             : ${malDimensionnes}`)
console.log(`  vides                : ${manquants}`)
const ok = complets === total
console.log(ok ? '\n==> OK : 100 % complet' : `\n==> INCOMPLET : ${total - complets} couple(s) manquant(s)`)

await admin.from('courses').delete().in('id', courseIds)
await admin.auth.admin.deleteUser(userId)
console.log('(cours et utilisateur de test supprimes)')
process.exit(ok ? 0 : 1)
