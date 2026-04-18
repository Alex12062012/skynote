/**
 * Calcule la matière dominante d'un enfant
 * Fonction pure — utilisable côté client et serveur
 */
export function calculateTalent(stats: any[]): { subject: string; score: number } | null {
  if (!stats || stats.length === 0) return null

  let best = null
  let bestScore = -1

  for (const s of stats) {
    if (s.qcm_count === 0) continue
    const successRate = s.qcm_perfect / s.qcm_count
    const volumeBonus = 1 + Math.log(s.courses_count + 1) * 0.3
    const score = successRate * volumeBonus * 100

    if (score > bestScore) {
      bestScore = score
      best = { subject: s.subject, score: Math.round(score) }
    }
  }

  return best
}
