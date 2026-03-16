'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { activatePremiumWithCoins } from '@/lib/supabase/objectives-actions'

export function ActivatePremiumButton({ coins }: { coins: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleActivate() {
    startTransition(async () => {
      const result = await activatePremiumWithCoins()
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          router.refresh()
        }, 1800)
      } else {
        setError(result.error ?? 'Erreur inconnue')
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-[13px]">
        <SkyCoin size={16} />
        Activer (100 coins)
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Activer Premium">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-5xl animate-pop-in">⭐</span>
            <p className="font-display text-h4 text-success dark:text-success-dark">Premium activé !</p>
            <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              Tu as 1 mois d'accès Premium. Profites-en !
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-input bg-sky-surface-2 px-4 py-3 dark:bg-night-surface-2">
                <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">Ton solde</span>
                <div className="flex items-center gap-1.5">
                  <SkyCoin size={18} />
                  <span className="font-body text-[15px] font-bold text-brand dark:text-brand-dark">{coins} coins</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-input bg-sky-surface-2 px-4 py-3 dark:bg-night-surface-2">
                <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">Coût</span>
                <div className="flex items-center gap-1.5">
                  <SkyCoin size={18} />
                  <span className="font-body text-[15px] font-bold text-error">-100 coins</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-input border border-brand/20 bg-brand-soft px-4 py-3 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
                <span className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">Nouveau solde</span>
                <div className="flex items-center gap-1.5">
                  <SkyCoin size={18} />
                  <span className="font-body text-[15px] font-bold text-brand dark:text-brand-dark">{coins - 100} coins</span>
                </div>
              </div>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                Tu bénéficieras de <strong>1 mois Premium</strong> : cours illimités et accès prioritaire aux nouvelles fonctionnalités.
              </p>
              {error && <p className="font-body text-[13px] text-error">{error}</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Annuler</Button>
              <Button className="flex-1 gap-2" loading={isPending} onClick={handleActivate}>
                <SkyCoin size={16} />
                Confirmer
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
