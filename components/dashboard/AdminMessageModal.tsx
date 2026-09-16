'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { NovaCoin } from '@/components/ui/NovaCoin'
import { useCoinReward } from '@/components/providers/CoinRewardProvider'
import { creditBadge } from '@/lib/admin-credit-message'

export interface AdminMessage {
  id: string
  content: string
  /** Récompense à créditer au clic OK (broadcasts) */
  reward_type: 'sky_coins' | 'nova' | null
  reward_amount: number | null
  /** Montant DÉJÀ appliqué par l'admin (crédit / retrait ciblé), affiché seulement */
  applied_type?: 'sky_coins' | 'nova' | null
  applied_amount?: number | null
}

/**
 * Message du jour : popup unique avec un seul bouton OK. Monté dans le layout
 * dashboard uniquement quand le serveur a trouvé un message actif non vu.
 * Fermer autrement (Échap, clic à côté) marque aussi comme vu : on ne veut
 * pas harceler l'élève à chaque navigation.
 */
export function AdminMessageModal({ message }: { message: AdminMessage }) {
  const router = useRouter()
  const { showReward } = useCoinReward()
  const [open, setOpen] = useState(true)
  const [sending, setSending] = useState(false)

  async function acknowledge() {
    if (sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: message.id }),
      })
      const data = await res.json().catch(() => null)
      setOpen(false)
      if (data?.rewarded?.type === 'sky_coins') {
        showReward({ amount: data.rewarded.amount, reason: 'Message du jour' })
      }
      // Solde Novas / coins de la navbar rendu côté serveur : on le rafraîchit.
      if (data?.rewarded) router.refresh()
    } catch {
      setOpen(false)
    } finally {
      setSending(false)
    }
  }

  // Un seul badge : récompense à venir (broadcast) ou montant déjà appliqué
  // (crédit ciblé). Même rendu, en bas à gauche du bouton OK.
  const badge = message.reward_type && message.reward_amount
    ? { kind: message.reward_type, amount: message.reward_amount }
    : message.applied_type && message.applied_amount
      ? { kind: message.applied_type, amount: message.applied_amount }
      : null
  const badgeLabel = badge ? creditBadge(badge.kind, badge.amount) : null

  return (
    <Modal isOpen={open} onClose={acknowledge} title="Message de Skynote">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
          <Megaphone className="h-5 w-5 text-brand dark:text-brand-dark" />
        </div>
        <p className="whitespace-pre-wrap font-body text-[15px] leading-relaxed text-text-main dark:text-text-dark-main">
          {message.content}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {badge && badgeLabel ? (
          <span
            data-testid="admin-message-badge"
            className="inline-flex items-center gap-1.5 rounded-pill border border-amber-200 bg-amber-50 px-3 py-1.5 font-body text-[13px] font-semibold text-text-main dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-text-dark-main"
          >
            {badge.kind === 'nova' ? <NovaCoin size={16} /> : <SkyCoin size={16} />}
            {badgeLabel}
          </span>
        ) : <span />}
        <Button onClick={acknowledge} loading={sending}>OK</Button>
      </div>
    </Modal>
  )
}
