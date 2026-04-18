'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { activatePremiumWithCoins } from '@/lib/supabase/objectives-actions'

const PLUS_COST = 750

export function ActivatePremiumButton({ coins }: { coins: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const canAfford = coins >= PLUS_COST

  function handleActivate() {
    startTransition(async () => {
      const result = await activatePremiumWithCoins()
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          router.refresh()
        }, 2000)
      } else {
        setError(result.error ?? 'Erreur inconnue')
      }
    })
  }

  return (
    <>
      {/* Bouton principal */}
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-[13px]">
        <SkyCoin size={16} />
        Activer Plus ({PLUS_COST} coins)
      </Button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-card-login bg-sky-surface p-6 shadow-2xl dark:bg-night-surface animate-slide-in">

            {success ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 animate-pop-in">
                  <Star className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <p className="font-display text-h3 text-success dark:text-success-dark">Plus activé !</p>
                  <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
                    Tu as 1 mois d'accès au plan Plus. Profites-en !
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display text-h4 text-text-main dark:text-text-dark-main">
                    Activer le plan Plus
                  </h3>
                  <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-main dark:hover:text-text-dark-main text-xl">×</button>
                </div>

                {/* Avantages */}
                <div className="mb-4 rounded-card border border-brand/20 bg-brand-soft p-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
                  <p className="font-body text-[13px] font-semibold text-brand dark:text-brand-dark mb-2">
                    Ce que tu débloqueras :
                  </p>
                  <ul className="space-y-1">
                    {['Cours illimités (plus de limite de 3/semaine)', 'Dictée vocale activée', 'Accès prioritaire aux nouveautés'].map(item => (
                      <li key={item} className="flex items-center gap-2 font-body text-[13px] text-text-main dark:text-text-dark-main">
                        <Check className="h-4 w-4 text-green-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Récap coins */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between rounded-input bg-sky-surface-2 px-4 py-2.5 dark:bg-night-surface-2">
                    <span className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">Ton solde</span>
                    <div className="flex items-center gap-1.5">
                      <SkyCoin size={16} />
                      <span className="font-body text-[14px] font-bold text-text-main dark:text-text-dark-main">{coins.toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-input bg-sky-surface-2 px-4 py-2.5 dark:bg-night-surface-2">
                    <span className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">Coût</span>
                    <div className="flex items-center gap-1.5">
                      <SkyCoin size={16} />
                      <span className="font-body text-[14px] font-bold text-error">-{PLUS_COST}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-input border border-brand/20 bg-brand-soft px-4 py-2.5 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
                    <span className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">Après activation</span>
                    <div className="flex items-center gap-1.5">
                      <SkyCoin size={16} />
                      <span className="font-body text-[14px] font-bold text-brand dark:text-brand-dark">{(coins - PLUS_COST).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                {error && <p className="mb-3 font-body text-[13px] text-error">{error}</p>}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button className="flex-1 gap-2" loading={isPending} onClick={handleActivate} disabled={!canAfford}>
                    <SkyCoin size={16} />
                    Confirmer
                  </Button>
                </div>

                {/* Lien vers pricing */}
                <p className="mt-3 text-center font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                  Préfères-tu payer par carte ?{' '}
                  <Link href="/pricing" className="text-brand hover:underline dark:text-brand-dark" onClick={() => setOpen(false)}>Voir les tarifs
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
