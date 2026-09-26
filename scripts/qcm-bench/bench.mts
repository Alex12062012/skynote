/**
 * Benchmark de la generation QCM : modele x variante de prompt.
 *
 * Mesure, par appel : latence, tokens de sortie, stop_reason, parse OK/KO,
 * et le verdict de la VRAIE validation de production
 * (validateGeneratedQuestions), pour que "acceptable" veuille dire la meme
 * chose ici et en prod.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import Anthropic from '@anthropic-ai/sdk'
import { getQcmSystemPrompt, QCM_QUESTIONS_REQUESTED, QCM_QUESTIONS_PER_FLASHCARD, type QcmDifficulty, QCM_DIFFICULTIES } from '../../lib/ai/prompts'
import { validateGeneratedQuestions, type GeneratedQuestion } from '../../lib/ai/generate'
import { FICHES, type Fiche } from './fixtures.mts'
import { VARIANTS, type Variant } from './variants.mts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MODELS = (process.env.MODELS ?? 'claude-sonnet-5,claude-haiku-4-5-20251001').split(',')
const VARIANT_NAMES = (process.env.VARIANTS ?? Object.keys(VARIANTS).join(',')).split(',')
const REPS = Number(process.env.REPS ?? 2)
/** Nombre d'appels lances en meme temps — reproduit la charge reelle (3 niveaux x N fiches). */
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 1)

type Row = {
  model: string; variant: string; difficulty: QcmDifficulty; fiche: string; rep: number
  ms: number; outTokens: number; stopReason: string | null
  parsed: boolean; nQuestions: number; valid: boolean; nSane: number; reason: string
}

function parseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()) as T
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) as T } catch { return null } }
    return null
  }
}

async function oneCall(model: string, v: Variant, fiche: Fiche, difficulty: QcmDifficulty, rep: number): Promise<Row> {
  const t0 = Date.now()
  const base: Row = {
    model, variant: v.name, difficulty, fiche: fiche.title, rep,
    ms: 0, outTokens: 0, stopReason: null, parsed: false, nQuestions: 0, valid: false, nSane: 0, reason: '',
  }
  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: v.maxTokens(1),
      system: v.system(difficulty),
      messages: [{ role: 'user', content: v.user([fiche]) }],
    })
    base.ms = Date.now() - t0
    base.outTokens = msg.usage.output_tokens
    base.stopReason = msg.stop_reason ?? null
    const raw = msg.content.filter(b => b.type === 'text').map(b => (b as any).text).join('')
    const questions = v.extract(raw, [fiche], parseJSON)
    if (questions === null) { base.reason = 'parse KO'; return base }
    base.parsed = true
    base.nQuestions = questions.length
    const check = validateGeneratedQuestions(questions, QCM_QUESTIONS_PER_FLASHCARD, difficulty)
    base.valid = check.valid
    base.nSane = check.questions.length
    if (!check.valid) base.reason = (check as any).reason
    return base
  } catch (e: any) {
    base.ms = Date.now() - t0
    base.reason = `erreur: ${e?.status ?? ''} ${e?.message ?? e}`.slice(0, 120)
    return base
  }
}

async function runPool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const out: T[] = new Array(tasks.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= tasks.length) return
      out[i] = await tasks[i]()
      const r: any = out[i]
      process.stdout.write(`[${i + 1}/${tasks.length}] ${r.model.replace('claude-','')} ${r.variant} ${r.difficulty} "${r.fiche.slice(0,22)}" ${(r.ms/1000).toFixed(1)}s ${r.outTokens}tok ${r.stopReason} ${r.valid ? 'OK' : 'KO:' + r.reason}
`)
    }
  }))
  return out
}

const tasks: (() => Promise<Row>)[] = []
for (const model of MODELS)
  for (const name of VARIANT_NAMES)
    for (const difficulty of QCM_DIFFICULTIES)
      for (const fiche of FICHES)
        for (let rep = 1; rep <= REPS; rep++)
          tasks.push(() => oneCall(model, VARIANTS[name], fiche, difficulty, rep))

console.log(`${tasks.length} appels — modeles=${MODELS.join(',')} variantes=${VARIANT_NAMES.join(',')} reps=${REPS} concurrence=${CONCURRENCY}\n`)

const rows = await runPool(tasks, CONCURRENCY)

// ─── Agregation ────────────────────────────────────────────────────────────
const pct = (n: number, d: number) => d === 0 ? '—' : `${Math.round(100 * n / d)}%`
const q = (xs: number[], p: number) => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}

const groups = new Map<string, Row[]>()
for (const r of rows) {
  const k = `${r.model}|${r.variant}`
  ;(groups.get(k) ?? groups.set(k, []).get(k)!).push(r)
}

console.log('modele / variante'.padEnd(46), 'n'.padStart(4), 'p50'.padStart(7), 'p95'.padStart(7), 'tok'.padStart(6), 'parse'.padStart(7), '5/5 OK'.padStart(8), 'tronq'.padStart(7))
console.log('-'.repeat(100))
for (const [k, rs] of groups) {
  const ms = rs.map(r => r.ms)
  const trunc = rs.filter(r => r.stopReason === 'max_tokens').length
  console.log(
    k.padEnd(46),
    String(rs.length).padStart(4),
    `${(q(ms, .5) / 1000).toFixed(1)}s`.padStart(7),
    `${(q(ms, .95) / 1000).toFixed(1)}s`.padStart(7),
    String(Math.round(rs.reduce((a, r) => a + r.outTokens, 0) / rs.length)).padStart(6),
    pct(rs.filter(r => r.parsed).length, rs.length).padStart(7),
    pct(rs.filter(r => r.valid).length, rs.length).padStart(8),
    pct(trunc, rs.length).padStart(7),
  )
}

console.log('\n── echecs par niveau ──')
for (const [k, rs] of groups) {
  for (const d of QCM_DIFFICULTIES) {
    const sub = rs.filter(r => r.difficulty === d)
    const bad = sub.filter(r => !r.valid)
    if (bad.length) console.log(`${k} / ${d}: ${bad.length}/${sub.length} KO — ${[...new Set(bad.map(b => b.reason))].join(' | ')}`)
  }
}

const fs = await import('node:fs')
const out = process.env.OUT ?? 'scripts/qcm-bench/last-run.json'
fs.writeFileSync(out, JSON.stringify(rows, null, 2))
console.log(`\n(${rows.length} lignes -> ${out})`)
