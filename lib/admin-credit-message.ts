/**
 * Contenu du message ciblé qui accompagne un crédit / retrait admin
 * (Sky Coins ou Novas). Pure : testable sans DB.
 *
 * Format : le texte libre de l'admin (optionnel), un saut de ligne, puis la
 * ligne générée à partir du montant RÉELLEMENT appliqué (le solde ne descend
 * jamais sous 0, un retrait peut donc être tronqué). Sans texte admin, la
 * ligne générée part seule. Si rien n'a changé (delta 0) → null, pas de message.
 */
export type CreditKind = 'sky_coins' | 'nova'

export function creditLine(kind: CreditKind, delta: number): string | null {
  const n = Math.trunc(delta)
  if (!Number.isFinite(n) || n === 0) return null
  const abs = Math.abs(n)
  const unite = kind === 'nova' ? `Nova${abs > 1 ? 's' : ''} ✦` : `Sky Coin${abs > 1 ? 's' : ''}`
  return n > 0
    ? `+${abs} ${unite} ajouté${abs > 1 ? 's' : ''} à ton compte.`
    : `-${abs} ${unite} retiré${abs > 1 ? 's' : ''} de ton compte.`
}

export function creditMessageContent(kind: CreditKind, delta: number, adminText: unknown): string | null {
  const line = creditLine(kind, delta)
  if (!line) return null
  const text = typeof adminText === 'string' ? adminText.trim() : ''
  // 2000 = CHECK SQL sur admin_messages.content ; la ligne générée est prioritaire.
  const room = 2000 - line.length - 1
  return text ? `${text.slice(0, room)}\n${line}` : line
}
