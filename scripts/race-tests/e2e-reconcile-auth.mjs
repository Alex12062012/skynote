/**
 * Authentification de /api/qcm/reconcile.
 *
 * La route peut declencher des appels Anthropic : la seule chose qu'un secret
 * protege ici, c'est la facture. Elle ne prend aucun parametre utilisateur
 * (elle choisit son travail en base), donc meme avec le secret on ne peut agir
 * sur les donnees de personne. Ce test verifie les deux moities de l'affirmation
 * « c'est vraiment rejete » : le code retour ET l'absence d'effet de bord.
 *
 *   BASE=https://www.skynote.fr node scripts/race-tests/e2e-reconcile-auth.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const BASE = process.env.BASE ?? 'https://www.skynote.fr'
const URL = `${BASE}/api/qcm/reconcile`
const SECRET = process.env.SECRET ?? env.QCM_RECONCILE_SECRET
if (!SECRET) throw new Error('QCM_RECONCILE_SECRET absent de .env.local')

const H = 'x-reconcile-secret'
let ok = true
const check = (label, got, want) => {
  const pass = got === want
  if (!pass) ok = false
  console.log(`${pass ? '  OK  ' : 'ECHEC '} ${label.padEnd(42)} HTTP ${got}${pass ? '' : ` (attendu ${want})`}`)
}

async function status(method, headers = {}, url = URL) {
  const res = await fetch(url, { method, headers })
  await res.text().catch(() => {})
  return res.status
}

async function snapshot() {
  const [q, a, l] = await Promise.all([
    admin.from('qcm_questions').select('id', { count: 'exact', head: true }),
    admin.from('qcm_fill_attempts').select('course_id', { count: 'exact', head: true }),
    admin.from('generation_locks').select('lock_key', { count: 'exact', head: true }),
  ])
  return { questions: q.count ?? 0, tentatives: a.count ?? 0, baux: l.count ?? 0 }
}

console.log(`cible ${URL}\n`)
const before = await snapshot()
console.log(`etat avant : ${JSON.stringify(before)}\n`)

console.log('── requetes qui doivent etre refusees (401) ──')
check('aucun en-tete',                  await status('POST'), 401)
check('en-tete vide',                   await status('POST', { [H]: '' }), 401)
check('secret bidon',                   await status('POST', { [H]: 'bidon' }), 401)
check('secret tronque',                 await status('POST', { [H]: SECRET.slice(0, -1) }), 401)
check('secret + 1 caractere',           await status('POST', { [H]: SECRET + 'x' }), 401)
check('prefixe correct, dernier faux',  await status('POST', { [H]: SECRET.slice(0, -1) + (SECRET.at(-1) === 'A' ? 'B' : 'A') }), 401)
check('bon secret, mauvais en-tete',    await status('POST', { authorization: `Bearer ${SECRET}` }), 401)
check('secret en query string',         await status('POST', {}, `${URL}?secret=${encodeURIComponent(SECRET)}`), 401)
check('GET sans en-tete',               await status('GET'), 401)
check('GET secret bidon',               await status('GET', { [H]: 'bidon' }), 401)

console.log('\n── methodes non exposees (405) ──')
for (const m of ['PUT', 'DELETE', 'PATCH']) check(m, await status(m, { [H]: SECRET }), 405)

console.log('\n── aucun effet de bord apres tous ces refus ──')
const after = await snapshot()
check('questions inchangees',  after.questions, before.questions)
check('tentatives inchangees', after.tentatives, before.tentatives)
check('aucun bail pose',       after.baux, before.baux)

console.log('\n── le bon secret passe ──')
check('POST bon secret', await status('POST', { [H]: SECRET }), 200)
check('GET bon secret',  await status('GET', { [H]: SECRET }), 200)

console.log(`\n${ok ? '==> OK : tout ce qui n\'a pas le secret est refuse, sans effet' : '==> ECHEC'}`)
process.exit(ok ? 0 : 1)
