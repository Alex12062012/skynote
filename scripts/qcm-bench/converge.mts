/**
 * Simulation de convergence.
 *
 * Le benchmark donne un taux d'echec PAR APPEL. Ce qui interesse l'utilisateur
 * est tout autre chose : la probabilite qu'un cours finisse avec ses 3 niveaux
 * complets. Ce script fait le pont entre les deux, en rejouant la mecanique
 * reelle de fillQcmLevel a partir des resultats mesures.
 *
 * Il ne simule PAS le modele : il tire au sort dans les resultats reellement
 * observes (bootstrap sur confirm-haiku.json), donc la distribution des
 * "4/5 valides", "3/5", "parse KO" est celle du vrai modele, pas une hypothese.
 *
 *   npx tsx scripts/qcm-bench/converge.mts
 */
import { readFileSync } from 'node:fs'

type Row = {
  variant: string
  difficulty: string
  nSane: number
  valid: boolean
  ms: number
}

const SRC = process.env.SRC ?? 'scripts/qcm-bench/confirm-haiku.json'
const VARIANT = process.env.VARIANT ?? 'shipped'
const QUESTIONS_NEEDED = 5
/** Budget de generation d'une invocation (route utilisateur : 52 s). */
const BUDGET_MS = Number(process.env.BUDGET_MS ?? 52_000)
/** Marge de securite de fillQcmLevel avant d'entamer un tour. */
const SAFETY = 1.25
const TRIALS = Number(process.env.TRIALS ?? 20_000)
/** Fiches par cours (plafonne a 4 en code, 3 possible). */
const FICHES_PER_COURSE = Number(process.env.FICHES ?? 4)
/** Tentatives du reconciliateur serveur avant abandon (claim_qcm_fill_targets). */
const CRON_ATTEMPTS = Number(process.env.CRON_ATTEMPTS ?? 8)

const rows: Row[] = JSON.parse(readFileSync(SRC, 'utf8'))
const pool = rows.filter((r) => r.variant === VARIANT)
if (pool.length === 0) throw new Error(`aucune ligne pour la variante ${VARIANT} dans ${SRC}`)

const byLevel = new Map<string, Row[]>()
for (const r of pool) (byLevel.get(r.difficulty) ?? byLevel.set(r.difficulty, []).get(r.difficulty)!).push(r)

const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

/**
 * Une invocation de fillQcmLevel pour UN niveau : plusieurs tours tant que le
 * budget le permet, avec accumulation des questions valides entre les tours.
 * Retourne le nombre de fiches encore incompletes a la fin.
 */
function runInvocation(level: string, fichesRemaining: number, budgetMs: number): number {
  const samples = byLevel.get(level)!
  // Banque de questions valides deja obtenues, par fiche.
  const bank = new Array(fichesRemaining).fill(0)
  let spent = 0
  let roundEstimate = 14_000

  while (bank.some((b) => b < QUESTIONS_NEEDED)) {
    if (budgetMs - spent < roundEstimate * SAFETY) break

    // Les fiches d'un tour partent en parallele : le tour coute le plus lent.
    let slowest = 0
    for (let i = 0; i < bank.length; i++) {
      if (bank[i] >= QUESTIONS_NEEDED) continue
      const s = pick(samples)
      slowest = Math.max(slowest, s.ms)
      // Dedoublonnage : un second tour sur la meme fiche redonne souvent des
      // questions deja en banque. Hypothese prudente — on ne compte que la
      // moitie des questions des tours suivants comme nouvelles.
      const fresh = bank[i] === 0 ? s.nSane : Math.ceil(s.nSane / 2)
      bank[i] = Math.min(QUESTIONS_NEEDED, bank[i] + fresh)
    }
    spent += slowest
    roundEstimate = Math.max(slowest, 3_000)
  }

  return bank.filter((b) => b < QUESTIONS_NEEDED).length
}

function simulateCourse(cronAttempts: number): { complete: boolean; invocations: number } {
  let invocations = 0
  const levels = ['peaceful', 'easy', 'medium']
  const remaining = new Map(levels.map((l) => [l, FICHES_PER_COURSE]))

  // 1. Les 3 passages du navigateur (QcmGenerator, MAX_PASSES = 3).
  for (let pass = 0; pass < 3; pass++) {
    for (const l of levels) {
      if (remaining.get(l)! === 0) continue
      invocations++
      remaining.set(l, runInvocation(l, remaining.get(l)!, BUDGET_MS))
    }
    if ([...remaining.values()].every((v) => v === 0)) break
  }

  // 2. Le reconciliateur serveur, une cible par passage de cron.
  for (let a = 0; a < cronAttempts; a++) {
    if ([...remaining.values()].every((v) => v === 0)) break
    for (const l of levels) {
      if (remaining.get(l)! === 0) continue
      invocations++
      remaining.set(l, runInvocation(l, remaining.get(l)!, 50_000))
    }
  }

  return { complete: [...remaining.values()].every((v) => v === 0), invocations }
}

console.log(`variante=${VARIANT}  echantillons=${pool.length}  fiches/cours=${FICHES_PER_COURSE}  tirages=${TRIALS}`)
const perCallKo = pool.filter((r) => !r.valid).length / pool.length
console.log(`taux d'echec PAR APPEL mesure : ${(100 * perCallKo).toFixed(1)} %\n`)

for (const [label, cron] of [
  ['navigateur seul (3 passages)', 0],
  ['navigateur + reconciliateur serveur', CRON_ATTEMPTS],
] as const) {
  let ok = 0
  let inv = 0
  for (let i = 0; i < TRIALS; i++) {
    const r = simulateCourse(cron)
    if (r.complete) ok++
    inv += r.invocations
  }
  const fails = TRIALS - ok
  console.log(
    `${label.padEnd(38)} cours complets : ${((100 * ok) / TRIALS).toFixed(3)} %  ` +
    `(${fails} echec(s) sur ${TRIALS})  invocations moy. ${(inv / TRIALS).toFixed(1)}`
  )
}
