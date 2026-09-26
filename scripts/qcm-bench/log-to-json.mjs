/**
 * Reconstruit le JSON de resultats a partir du log de progression de bench.mts.
 *
 * bench.mts n'ecrit son JSON qu'a la toute fin. Ce script permet d'exploiter un
 * run interrompu (ou de recouper le log et le JSON), sans refaire les appels.
 *
 *   node scripts/qcm-bench/log-to-json.mjs scripts/qcm-bench/confirm-haiku.log > rows.json
 */
import { readFileSync } from 'node:fs'

const src = process.argv[2]
if (!src) {
  console.error('usage: node log-to-json.mjs <fichier.log>')
  process.exit(1)
}

// [12/216] haiku-4-5-20251001 shipped medium "Le cycle de Calvin" 6.5s 732tok end_turn OK
// [53/216] ... KO:biais de longueur, 4/5 questions valides
const LINE = /^\[(\d+)\/\d+\]\s+(\S+)\s+(\S+)\s+(\S+)\s+"([^"]*)"\s+([\d.]+)s\s+(\d+)tok\s+(\S+)\s+(OK|KO:.*)$/

const rows = []
for (const line of readFileSync(src, 'utf8').split('\n')) {
  const m = LINE.exec(line.trim())
  if (!m) continue
  const [, , model, variant, difficulty, fiche, secs, tok, stopReason, verdict] = m
  const valid = verdict === 'OK'
  const reason = valid ? '' : verdict.slice(3)

  // nSane : le nombre de questions qui ont passe le filtre. Le message de la
  // validation le porte ("4/5 questions valides") ; un OK vaut 5.
  let nSane = 5
  if (!valid) {
    const n = /(\d+)\/5 questions valides/.exec(reason)
    nSane = n ? Number(n[1]) : 0
  }

  rows.push({
    model, variant, difficulty, fiche,
    ms: Math.round(Number(secs) * 1000),
    outTokens: Number(tok),
    stopReason,
    parsed: !reason.includes('parse KO'),
    nQuestions: nSane,
    valid,
    nSane,
    reason,
  })
}

process.stdout.write(JSON.stringify(rows, null, 2))
console.error(`${rows.length} lignes reconstruites depuis ${src}`)
