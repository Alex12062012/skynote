'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, ArrowLeft } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { cn } from '@/lib/utils'
import { activatePremiumWithCoins } from '@/lib/supabase/objectives-actions'

type Billing = 'monthly' | 'yearly'

const PLANS = [
  {
    id: 'free', name: 'Gratuit', icon: '📚',
    price: { monthly: 0, yearly: 0 },
    description: 'Pour découvrir Skynote',
    color: 'border-slate-200 dark:border-slate-700',
    features: [
      { text: '3 cours par semaine', ok: true },
      { text: 'Fiches générées par l\'IA', ok: true },
      { text: '5 questions QCM par fiche', ok: true },
      { text: 'Sky Coins & objectifs', ok: true },
      { text: 'Dictée vocale', ok: false },
      { text: 'Cours illimités', ok: false },
      { text: 'Navigation familiale', ok: false },
    ],
  },
  {
    id: 'plus', name: 'Plus', icon: '⭐',
    price: { monthly: 4.99, yearly: 3.99 },
    yearlyTotal: 47.88,
    description: 'Pour les élèves sérieux',
    color: 'border-brand dark:border-brand-dark ring-2 ring-brand/20',
    popular: true,
    coinsOption: true,
    features: [
      { text: 'Cours illimités', ok: true },
      { text: 'Fiches générées par l\'IA', ok: true },
      { text: '5 questions QCM par fiche', ok: true },
      { text: 'Sky Coins & objectifs', ok: true },
      { text: 'Dictée vocale activée', ok: true },
      { text: 'Accès prioritaire nouveautés', ok: true },
      { text: 'Navigation familiale', ok: false },
    ],
  },
  {
    id: 'famille', name: 'Famille', icon: '👨‍👩‍👧',
    price: { monthly: 11.99, yearly: 10.99 },
    yearlyTotal: 131.88,
    description: 'Pour toute la famille',
    color: 'border-purple-400 dark:border-purple-500',
    features: [
      { text: 'Tout le plan Plus', ok: true },
      { text: 'Jusqu\'à 6 comptes enfants', ok: true },
      { text: 'Dashboard parent', ok: true },
      { text: 'Talent dominant par enfant', ok: true },
      { text: 'Navigation entre comptes', ok: true },
      { text: 'Dictée vocale activée', ok: true },
      { text: 'Support prioritaire', ok: true },
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<Billing>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [coinsSuccess, setCoinsSuccess] = useState(false)
  const [coinsError, setCoinsError] = useState('')

  async function handleStripe(planId: string) {
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billing }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Stripe non configuré pour l\'instant')
    } catch { alert('Erreur réseau') }
    setLoadingPlan(null)
  }

  function handleCoins() {
    startTransition(async () => {
      const result = await activatePremiumWithCoins()
      if (result.success) {
        setCoinsSuccess(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setCoinsError(result.error ?? 'Erreur')
      }
    })
  }

  if (coinsSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-bg dark:bg-night-bg">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <span className="text-6xl">⭐</span>
          <h2 className="font-display text-h2 text-success dark:text-success-dark">Plan Plus activé !</h2>
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Tu as 1 mois d'accès illimité. Redirection...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-10 text-center">
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-3">
            Choisir son forfait
          </h1>
          <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            Commence gratuitement, évolue quand tu veux.
          </p>

          <div className="mt-6 inline-flex items-center gap-1 rounded-pill border border-sky-border bg-sky-surface p-1 dark:border-night-border dark:bg-night-surface">
            {(['monthly', 'yearly'] as Billing[]).map((b) => (
              <button key={b} onClick={() => setBilling(b)}
                className={cn('flex items-center gap-2 rounded-pill px-4 py-2 font-body text-[14px] font-medium transition-all',
                  billing === b
                    ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                    : 'text-text-secondary dark:text-text-dark-secondary'
                )}>
                {b === 'monthly' ? 'Mensuel' : 'Annuel'}
                {b === 'yearly' && (
                  <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-bold',
                    billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  )}>-15%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === 'yearly' ? plan.price.yearly : plan.price.monthly
            const isLoading = loadingPlan === plan.id

            return (
              <div key={plan.id} className={cn(
                'relative rounded-card-login border bg-sky-surface p-6 shadow-card dark:bg-night-surface flex flex-col',
                plan.color
              )}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-pill bg-brand px-4 py-1 font-body text-[12px] font-bold text-white dark:bg-brand-dark dark:text-night-bg">
                      Le plus populaire
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{plan.icon}</span>
                    <h2 className="font-display text-[22px] font-bold text-text-main dark:text-text-dark-main">{plan.name}</h2>
                  </div>
                  <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mb-3">{plan.description}</p>
                  {price === 0 ? (
                    <p className="font-display text-[34px] font-bold text-text-main dark:text-text-dark-main">Gratuit</p>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-[34px] font-bold text-text-main dark:text-text-dark-main">{price.toFixed(2)}€</span>
                        <span className="font-body text-[14px] text-text-tertiary">/mois</span>
                      </div>
                      {billing === 'yearly' && (plan as any).yearlyTotal && (
                        <p className="font-body text-[12px] text-text-tertiary">{(plan as any).yearlyTotal.toFixed(2)}€ / an</p>
                      )}
                    </>
                  )}
                </div>

                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5">
                      {f.ok
                        ? <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                        : <X className="h-4 w-4 flex-shrink-0 text-text-tertiary" />}
                      <span className={cn('font-body text-[14px]',
                        f.ok ? 'text-text-main dark:text-text-dark-main' : 'text-text-tertiary'
                      )}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  {plan.id === 'free' ? (
                    <Link href="/dashboard"
                      className="flex items-center justify-center h-11 w-full rounded-input border border-sky-border font-body text-[14px] font-semibold text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary transition-colors">
                      Commencer gratuitement
                    </Link>
                  ) : (
                    <button onClick={() => handleStripe(plan.id)} disabled={isLoading}
                      className={cn(
                        'flex items-center justify-center h-11 w-full rounded-input font-body text-[14px] font-semibold transition-all disabled:opacity-60',
                        plan.id === 'plus'
                          ? 'bg-brand text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      )}>
                      {isLoading ? 'Chargement...' : `S'abonner — ${price.toFixed(2)}€/mois`}
                    </button>
                  )}

                  {/* Option coins directement sur la page — SANS modal */}
                  {(plan as any).coinsOption && (
                    <div className="rounded-input border border-brand/20 bg-brand-soft p-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
                      <div className="flex items-center gap-2 mb-3">
                        <SkyCoin size={18} />
                        <span className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">
                          Ou payer avec 750 Sky Coins
                        </span>
                        <span className="ml-auto font-body text-[12px] text-brand/60">1 mois</span>
                      </div>
                      {coinsError && (
                        <p className="mb-2 font-body text-[12px] text-error">{coinsError}</p>
                      )}
                      <button onClick={handleCoins} disabled={isPending}
                        className="flex items-center justify-center gap-2 h-9 w-full rounded-input bg-brand font-body text-[13px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60 dark:bg-brand-dark dark:text-night-bg transition-all">
                        <SkyCoin size={15} />
                        {isPending ? 'Activation...' : 'Utiliser mes Sky Coins'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            ['Puis-je changer de forfait ?', 'Oui, à tout moment depuis ton profil.'],
            ['Comment fonctionne l\'annuel ?', 'Tu paies une fois pour 12 mois, ~15% moins cher.'],
            ['C\'est quoi les Sky Coins ?', 'Monnaie virtuelle gagnée en révisant. 750 coins = 1 mois Plus.'],
            ['Le plan Famille c\'est pour qui ?', 'Pour les parents avec jusqu\'à 6 enfants à suivre.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
              <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main mb-1">{q}</p>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">{a}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-body text-[12px] text-text-tertiary">
          Paiement sécurisé par Stripe · Annulation à tout moment ·{' '}
          <Link href="/privacy" className="hover:underline">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  )
}
