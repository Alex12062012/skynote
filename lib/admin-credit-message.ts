/**
 * Message ciblé qui accompagne un crédit / retrait admin (Sky Coins ou Novas).
 * Pure : testable sans DB.
 *
 * Le montant n'est PAS dans le texte : il part en données structurées
 * (applied_type / applied_amount) et la popup l'affiche en badge à côté du
 * bouton OK. Ces colonnes sont purement informatives — le crédit a déjà été
 * appliqué par l'action admin, /api/messages/ack ne les lit pas (pas de
 * double crédit possible).
 */
export type CreditKind = 'sky_coins' | 'nova'

export const DEFAULT_CREDIT_TEXT = 'Ton solde a été mis à jour par l’équipe Skynote.'

/** Libellé court du badge : « +100 Novas ✦ », « -20 Sky Coins ». */
export function creditBadge(kind: CreditKind, delta: number): string | null {
  const n = Math.trunc(delta)
  if (!Number.isFinite(n) || n === 0) return null
  const abs = Math.abs(n)
  const unite = kind === 'nova' ? `Nova${abs > 1 ? 's' : ''} ✦` : `Sky Coin${abs > 1 ? 's' : ''}`
  return `${n > 0 ? '+' : '-'}${abs} ${unite}`
}

export interface CreditMessage {
  content: string
  applied_type: CreditKind
  applied_amount: number
}

/**
 * Ligne admin_messages à insérer pour un crédit de `delta` (montant RÉELLEMENT
 * appliqué : le solde ne descend jamais sous 0). Texte admin optionnel ;
 * sans texte, un libellé neutre. Delta nul → null, pas de message.
 */
export function creditMessage(kind: CreditKind, delta: number, adminText: unknown): CreditMessage | null {
  const n = Math.trunc(delta)
  if (!Number.isFinite(n) || n === 0) return null
  const text = typeof adminText === 'string' ? adminText.trim().slice(0, 2000) : ''
  return { content: text || DEFAULT_CREDIT_TEXT, applied_type: kind, applied_amount: n }
}
