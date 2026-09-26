/**
 * Test du filet serveur : un cours dont le navigateur ne s'occupe JAMAIS.
 *
 * Simule le cas qu'aucun reglage de la requete HTTP ne peut couvrir — l'eleve
 * ferme l'onglet pendant la generation. Aucun appel a /api/generate-qcm/level
 * n'est fait ici : seul le reconciliateur travaille.
 *
 *   SECRET_FILE=... BASE=https://www.skynote.fr node scripts/race-tests/e2e-qcm-reconcile.mjs
 *
 * Par defaut le script appelle lui-meme /api/qcm/reconcile en boucle, ce que
 * fait le cron toutes les minutes — en plus rapide, pour ne pas attendre son
 * tour derriere le reliquat historique. DRIVER=cron pour attendre le vrai cron.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const BASE = process.env.BASE ?? 'https://www.skynote.fr'
const SECRET = process.env.SECRET ?? env.QCM_RECONCILE_SECRET
const DRIVER = process.env.DRIVER ?? 'manual'
const TIMEOUT_MIN = Number(process.env.TIMEOUT_MIN ?? 15)
const LEVELS = ['peaceful', 'easy', 'medium']
const NEEDED = 5

if (!SECRET) throw new Error('QCM_RECONCILE_SECRET absent de .env.local')

const FICHES = [
  { title: 'Les volcans effusifs', summary: "Un volcan effusif emet une lave fluide qui s ecoule en coulees.", key_points: ['Lave fluide et pauvre en gaz', 'Coulees lentes, eruptions peu explosives', 'Exemple : le Piton de la Fournaise'] },
  { title: 'Les volcans explosifs', summary: "Un volcan explosif projette cendres et blocs lors d eruptions violentes.", key_points: ['Lave visqueuse et riche en gaz', 'Nuees ardentes tres dangereuses', 'Exemple : la montagne Pelee'] },
  { title: 'Le risque volcanique', summary: "Le risque depend de l alea et de la population exposee.", key_points: ['Risque = alea x enjeux humains', 'Surveillance par sismographes', 'Plans d evacuation et d alerte'] },
  { title: 'La structure d un volcan', summary: "Un volcan relie une chambre magmatique a la surface.", key_points: ['Chambre magmatique en profondeur', 'La cheminee conduit le magma', 'Le cratere est l ouverture au sommet'] },
]

const email = `qcm-reconcile-${Date.now()}@skynote-test.invalid`
const { data: created } = await admin.auth.admin.createUser({ email, password: `Rc!${crypto.randomUUID()}`, email_confirm: true })
const userId = created.user.id
await admin.from('profiles').upsert({ id: userId, email, plan: 'free', role: 'student' })

const { data: course } = await admin.from('courses').insert({
  user_id: userId, title: 'Les volcans (test reconciliation)', subject: 'SVT', source_type: 'text',
  source_content: 'x'.repeat(200), status: 'ready', progress: 0, qcm_status: 'processing', content_lang: 'fr',
}).select('id').single()
await admin.from('flashcards').insert(FICHES.map((f, i) => ({
  course_id: course.id, user_id: userId, order_index: i,
  title: f.title, summary: f.summary, key_points: f.key_points, is_mastered: false,
})))

const EXPECTED = FICHES.length * LEVELS.length
console.log(`cours ${course.id} — ${FICHES.length} fiches x ${LEVELS.length} niveaux = ${EXPECTED} couples`)
console.log(`AUCUN appel a /api/generate-qcm/level ne sera fait. Moteur : ${DRIVER}\n`)

async function complete() {
  const { data } = await admin.from('qcm_questions')
    .select('flashcard_id, difficulty').eq('course_id', course.id)
  const c = new Map()
  for (const q of data) {
    const k = `${q.flashcard_id}|${q.difficulty}`
    c.set(k, (c.get(k) ?? 0) + 1)
  }
  return [...c.values()].filter(v => v >= NEEDED).length
}

const t0 = Date.now()
const deadline = t0 + TIMEOUT_MIN * 60_000
let last = -1
let passes = 0

while (Date.now() < deadline) {
  if (DRIVER === 'manual') {
    passes++
    const res = await fetch(`${BASE}/api/qcm/reconcile`, {
      method: 'POST', headers: { 'x-reconcile-secret': SECRET },
    })
    const body = await res.json().catch(() => ({}))
    const mine = (body.results ?? []).filter(r => r.courseId === course.id)
    if (mine.length) for (const m of mine) {
      console.log(`  passage ${passes}: ${m.difficulty.padEnd(9)} complete=${m.complete} fiches=${m.fiches} tours=${m.rounds}`)
    }
  } else {
    await new Promise(r => setTimeout(r, 20_000))
  }

  const ok = await complete()
  if (ok !== last) {
    console.log(`  -> ${ok}/${EXPECTED} couples complets (+${((Date.now() - t0) / 1000).toFixed(0)}s)`)
    last = ok
  }
  if (ok >= EXPECTED) break
}

const ok = await complete()
console.log(`\n───────────────────── RESULTAT ─────────────────────`)
console.log(`couples complets a ${NEEDED}/5 : ${ok}/${EXPECTED}`)
console.log(`duree : ${((Date.now() - t0) / 1000).toFixed(0)}s, ${passes} passage(s) du reconciliateur`)
console.log(ok === EXPECTED
  ? '\n==> OK : le serveur a tout termine, sans le navigateur'
  : `\n==> INCOMPLET : ${EXPECTED - ok} couple(s) manquant(s)`)

await admin.from('courses').delete().eq('id', course.id)
await admin.auth.admin.deleteUser(userId)
console.log('(cours et utilisateur de test supprimes)')
process.exit(ok === EXPECTED ? 0 : 1)
