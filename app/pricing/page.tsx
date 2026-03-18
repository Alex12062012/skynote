'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, ArrowLeft, Zap } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { cn } from '@/lib/utils'

type Billing = 'monthly' | 'yearly'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: '📚',
    price: { monthly: 0, yearly: 0 },
    description: 'Pour découvrir Skynote',
    color: 'border-slate-200 dark:border-slate-700',
    badgeColor: '',
    features: [
      { text: '3 cours par semaine', included: true },
      { text: 'Fiches générées par l\'IA', included: true },
      { text: '5 questions QCM par fiche', included: true },
      { text: 'Sky Coins & objectifs', included: true },
      { text: 'Dictée vocale', included: false },
      { text: 'Cours illimités', included: false },
      { text: 'Navigation familiale', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    icon: '⭐',
    price: { monthly: 4.99, yearly: 3.99 },
    yearlyTotal: 47.88,
    description: 'Pour les élèves sérieux',
    color: 'border-brand dark:border-brand-dark ring-2 ring-brand/20',
    badgeColor: 'bg-brand text-white',
    popular: true,
    features: [
      { text: 'Cours illimités', included: true },
      { text: 'Fiches générées par l\'IA', included: true },
      { text: '5 questions QCM par fiche', included: true },
      { text: 'Sky Coins & objectifs', included: true },
      { text: 'Dictée vocale activée', included: true },
      { text: 'Accès prioritaire nouveautés', included: true },
      { text: 'Navigation familiale', included: false },
    ],
    coinsOption: true,
  },
  {
    id: 'famille',
    name: 'Famille',
    icon: '👨‍👩‍👧',
    price: { monthly: 11.99, yearly: 10.99 },
    yearlyTotal: 131.88,
    description: 'Pour toute la famille',
    color: 'border-purple-400 dark:border-purple-500',
    badgeColor: 'bg-purple-500 text-white',
    features: [
      { text: 'Tout le plan Plus', included: true },
      { text: 'Jusqu\'à 6 comptes enfants', included: true },
      { text: 'Dashboard parent', included: true },
      { text: 'Talent dominant par enfant', included: true },
      { text: 'Navigation entre comptes', included: true },
      { text: 'Dictée vocale activée', included: true },
      { text: 'Support prioritaire', included: true },
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<Billing>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubscribe(planId: string) {
    if (planId === 'free') return
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billing }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erreur lors de la création du paiement')
      }
    } catch {
      alert('Erreur réseau')
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-3">
            Choisir son forfait
          </h1>
          <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            Commence gratuitement, passe au niveau supérieur quand tu veux.
          </p>

          {/* Toggle mensuel/annuel */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-pill border border-sky-border bg-sky-surface p-1 dark:border-night-border dark:bg-night-surface">
            <button
              onClick={() => setBilling('monthly')}
              className={cn('rounded-pill px-4 py-2 font-body text-[14px] font-medium transition-all',
                billing === 'monthly' ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg' : 'text-text-secondary dark:text-text-dark-secondary'
              )}>
              Mensuel
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={cn('flex items-center gap-2 rounded-pill px-4 py-2 font-body text-[14px] font-medium transition-all',
                billing === 'yearly' ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg' : 'text-text-secondary dark:text-text-dark-secondary'
              )}>
              Annuel
              <span className={cn('rounded-pill px-2 py-0.5 font-body text-[11px] font-bold',
                billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-success-soft text-success dark:bg-emerald-950/30 dark:text-success-dark'
              )}>
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === 'yearly' ? plan.price.yearly : plan.price.monthly
            const isLoading = loading === plan.id

            return (
              <div key={plan.id} className={cn(
                'relative rounded-card-login border bg-sky-surface p-6 shadow-card dark:bg-night-surface dark:shadow-card-dark flex flex-col',
                plan.color
              )}>
                {/* Badge populaire */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-pill bg-brand px-4 py-1 font-body text-[12px] font-bold text-white dark:bg-brand-dark dark:text-night-bg">
                      Le plus populaire
                    </span>
                  </div>
                )}

                {/* Header plan */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{plan.icon}</span>
                    <h2 className="font-display text-[22px] font-bold text-text-main dark:text-text-dark-main">
                      {plan.name}
                    </h2>
                  </div>
                  <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mb-4">
                    {plan.description}
                  </p>

                  {/* Prix */}
                  <div>
                    {price === 0 ? (
                      <p className="font-display text-[36px] font-bold text-text-main dark:text-text-dark-main">
                        Gratuit
                      </p>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-[36px] font-bold text-text-main dark:text-text-dark-main">
                            {price.toFixed(2)}€
                          </span>
                          <span className="font-body text-[14px] text-text-tertiary dark:text-text-dark-tertiary">
                            /mois
                          </span>
                        </div>
                        {billing === 'yearly' && plan.yearlyTotal && (
                          <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                            {plan.yearlyTotal.toFixed(2)}€ facturé annuellement
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2.5">
                      {feature.included ? (
                        <Check className="h-4 w-4 flex-shrink-0 text-success dark:text-success-dark" />
                      ) : (
                        <X className="h-4 w-4 flex-shrink-0 text-text-tertiary dark:text-text-dark-tertiary" />
                      )}
                      <span className={cn('font-body text-[14px]',
                        feature.included ? 'text-text-main dark:text-text-dark-main' : 'text-text-tertiary dark:text-text-dark-tertiary'
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="space-y-2">
                  {plan.id === 'free' ? (
                    <Link href="/dashboard"
                      className="flex items-center justify-center h-11 w-full rounded-input border border-sky-border font-body text-[14px] font-semibold text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary dark:hover:bg-night-border transition-colors">
                      Commencer gratuitement
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading}
                      className={cn(
                        'flex items-center justify-center h-11 w-full rounded-input font-body text-[14px] font-semibold transition-all disabled:opacity-60',
                        plan.id === 'plus'
                          ? 'bg-brand text-white hover:bg-brand-hover shadow-btn dark:bg-brand-dark dark:text-night-bg'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      )}>
                      {isLoading ? 'Chargement...' : `S'abonner au plan ${plan.name}`}
                    </button>
                  )}

                  {/* Option Sky Coins pour Plus */}
                  {plan.coinsOption && (
                    <Link href="/objectives"
                      className="flex items-center justify-center gap-2 h-9 w-full rounded-input border border-brand/20 bg-brand-soft font-body text-[13px] font-medium text-brand hover:bg-brand/10 dark:border-brand-dark/20 dark:bg-brand-dark-soft dark:text-brand-dark transition-colors">
                      <SkyCoin size={16} />
                      Ou utiliser 750 Sky Coins (1 mois)
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ courte */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[
            ['Puis-je changer de forfait ?', 'Oui, à tout moment depuis ton profil. Le changement prend effet immédiatement.'],
            ['Comment fonctionne l\'annuel ?', 'Tu paies une seule fois pour 12 mois. Tu économises ~15% par rapport au mensuel.'],
            ['C\'est quoi les Sky Coins ?', 'Une monnaie virtuelle gagnée en révisant. 750 coins = 1 mois Plus gratuit.'],
            ['Le plan Famille c\'est pour qui ?', 'Pour les parents qui veulent suivre la progression de jusqu\'à 6 enfants.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
              <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main mb-1">{q}</p>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">{a}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
          Paiement sécurisé par Stripe · Annulation à tout moment ·{' '}
          <Link href="/privacy" className="hover:underline">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  )
}
