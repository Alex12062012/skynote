'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, ArrowLeft, Settings, Calendar, Star, Users, BookOpen } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { cn } from '@/lib/utils'

type Billing = 'monthly' | 'yearly'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    Icon: BookOpen,
    price: { monthly: 0, yearly: 0 },
    description: 'Pour découvrir Skynote',
    color: 'border-sky-border dark:border-night-border',
    features: [
      { text: '1 cours par semaine', ok: true },
      { text: 'Fiches générées par l\'IA', ok: true },
      { text: 'QCM automatiques', ok: true },
      { text: 'Sky Coins & objectifs', ok: true },
      { text: 'Dictée vocale', ok: false },
      { text: 'Chatbot IA par cours', ok: false },
      { text: 'Cours illimités', ok: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    Icon: Star,
    price: { monthly: 4.99, yearly: 3.99 },
    yearlyTotal: 47.88,
    description: 'Pour les élèves sérieux',
    color: 'border-brand dark:border-brand-dark',
    popular: true,
    features: [
      { text: 'Cours illimités', ok: true },
      { text: 'Fiches générées par l\'IA', ok: true },
      { text: 'QCM automatiques', ok: true },
      { text: 'Sky Coins & objectifs', ok: true },
      { text: 'Dictée vocale', ok: true },
      { text: 'Chatbot IA par cours', ok: true },
      { text: 'Accès prioritaire nouveautés', ok: true },
    ],
  },
  {
    id: 'famille',
    name: 'Famille',
    Icon: Users,
    price: { monthly: 11.99, yearly: 10.99 },
    yearlyTotal: 131.88,
    description: 'Pour toute la famille',
    color: 'border-purple-400 dark:border-purple-500',
    features: [
      { text: 'Tout le plan Plus', ok: true },
      { text: "Jusqu'à 6 comptes enfants", ok: true },
      { text: 'Dashboard parent', ok: true },
      { text: 'Navigation entre comptes', ok: true },
      { text: 'Dictée vocale', ok: true },
      { text: 'Chatbot IA par cours', ok: true },
      { text: 'Support prioritaire', ok: true },
    ],
  },
]

interface PricingClientProps {
  currentPlan: string
  planExpiresAt: string | null
  hasStripeSubscription: boolean
  isLoggedIn: boolean
}

export function PricingClient({ currentPlan, planExpiresAt, hasStripeSubscription, isLoggedIn }: PricingClientProps) {
  const router = useRouter()
  const [billing, setBilling] = useState<Billing>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const isPaid = currentPlan === 'plus' || currentPlan === 'famille'

  async function handleStripe(planId: string) {
    if (!isLoggedIn) { router.push('/signup'); return }
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billing }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Erreur Stripe')
    } catch {
      alert('Erreur réseau')
    }
    setLoadingPlan(null)
  }

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Erreur')
    } catch {
      alert('Erreur réseau')
    }
    setPortalLoading(false)
  }

  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-10 text-center">
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-3">
            {isPaid ? 'Ton abonnement' : 'Choisir son forfait'}
          </h1>
          <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {isPaid
              ? 'Gère ton abonnement et ta facturation.'
              : 'Commence gratuitement, évolue quand tu veux.'}
          </p>
        </div>

        {/* Bannière abonnement actif */}
        {isPaid && (
          <div className="mb-8 rounded-card border border-brand/20 bg-brand-soft p-5 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand dark:bg-brand-dark text-white dark:text-night-bg">
                  {currentPlan === 'famille'
                    ? <Users className="h-5 w-5" />
                    : <Star className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-display text-[17px] font-bold text-text-main dark:text-text-dark-main">
                    Plan {currentPlan === 'famille' ? 'Famille' : 'Plus'}
                  </p>
                  {planExpiresAt && (
                    <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Renouvellement le{' '}
                      {new Date(planExpiresAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
              {hasStripeSubscription && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex items-center justify-center gap-2 rounded-input border border-sky-border bg-sky-surface px-5 py-2.5 font-body text-[14px] font-medium text-text-main hover:bg-sky-cloud dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:hover:bg-night-border transition-colors disabled:opacity-50"
                >
                  <Settings className="h-4 w-4" />
                  {portalLoading ? 'Chargement...' : 'Gérer mon abonnement'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Toggle mensuel / annuel */}
        {!isPaid && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-pill border border-sky-border bg-sky-surface p-1 dark:border-night-border dark:bg-night-surface">
              {(['monthly', 'yearly'] as Billing[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={cn(
                    'flex items-center gap-2 rounded-pill px-4 py-2 font-body text-[14px] font-medium transition-all',
                    billing === b
                      ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                      : 'text-text-secondary dark:text-text-dark-secondary'
                  )}
                >
                  {b === 'monthly' ? 'Mensuel' : 'Annuel'}
                  {b === 'yearly' && (
                    <span className={cn(
                      'rounded-pill px-2 py-0.5 text-[11px] font-bold',
                      billing === 'yearly'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    )}>
                      -20%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cards plans */}
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === 'yearly' ? plan.price.yearly : plan.price.monthly
            const isLoading = loadingPlan === plan.id
            const isCurrentPlan = plan.id === currentPlan || (plan.id === 'plus' && currentPlan === 'premium')
            const isDowngrade = (currentPlan === 'famille' && plan.id === 'plus') || (isPaid && plan.id === 'free')
            const PlanIcon = plan.Icon

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-card-login border bg-sky-surface p-5 sm:p-6 shadow-card dark:bg-night-surface flex flex-col',
                  isCurrentPlan
                    ? 'border-brand dark:border-brand-dark ring-2 ring-brand/15 dark:ring-brand-dark/15'
                    : plan.color
                )}
              >
                {/* Badge populaire / plan actuel */}
                {(plan.popular && !isPaid) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-pill bg-brand px-4 py-1 font-body text-[11px] font-bold text-white dark:bg-brand-dark dark:text-night-bg">
                      Le plus populaire
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-pill bg-success px-4 py-1 font-body text-[11px] font-bold text-white">
                      Ton plan actuel
                    </span>
                  </div>
                )}

                {/* Header plan */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      plan.id === 'plus' ? 'bg-brand/10 dark:bg-brand-dark/10' :
                      plan.id === 'famille' ? 'bg-purple-100 dark:bg-purple-950/30' :
                      'bg-sky-cloud dark:bg-night-border'
                    )}>
                      <PlanIcon className={cn(
                        'h-4 w-4',
                        plan.id === 'plus' ? 'text-brand dark:text-brand-dark' :
                        plan.id === 'famille' ? 'text-purple-600 dark:text-purple-400' :
                        'text-text-secondary dark:text-text-dark-secondary'
                      )} />
                    </div>
                    <h2 className="font-display text-[20px] font-bold text-text-main dark:text-text-dark-main">
                      {plan.name}
                    </h2>
                  </div>
                  <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mb-3">
                    {plan.description}
                  </p>
                  {price === 0 ? (
                    <p className="font-display text-[32px] font-bold text-text-main dark:text-text-dark-main">
                      Gratuit
                    </p>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-[32px] font-bold text-text-main dark:text-text-dark-main">
                          {price.toFixed(2)}€
                        </span>
                        <span className="font-body text-[14px] text-text-tertiary">/mois</span>
                      </div>
                      {billing === 'yearly' && (plan as any).yearlyTotal && (
                        <p className="font-body text-[12px] text-text-tertiary">
                          soit {(plan as any).yearlyTotal.toFixed(2)}€/an
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5">
                      {f.ok
                        ? <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                        : <X className="h-4 w-4 flex-shrink-0 text-text-tertiary opacity-40" />}
                      <span className={cn(
                        'font-body text-[13px]',
                        f.ok
                          ? 'text-text-main dark:text-text-dark-main'
                          : 'text-text-tertiary dark:text-text-dark-tertiary'
                      )}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div>
                  {isCurrentPlan ? (
                    <div className="flex items-center justify-center h-11 w-full rounded-input bg-success/10 border border-success/20 font-body text-[14px] font-semibold text-success">
                      Plan actuel
                    </div>
                  ) : plan.id === 'free' ? (
                    <Link
                      href={isLoggedIn ? '/dashboard' : '/signup'}
                      className="flex items-center justify-center h-11 w-full rounded-input border border-sky-border font-body text-[14px] font-semibold text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary transition-colors"
                    >
                      {isLoggedIn ? 'Retour au dashboard' : 'Commencer gratuitement'}
                    </Link>
                  ) : isDowngrade ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="flex items-center justify-center h-11 w-full rounded-input border border-sky-border font-body text-[14px] font-semibold text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary transition-colors disabled:opacity-50"
                    >
                      {portalLoading ? 'Chargement...' : 'Changer de plan'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStripe(plan.id)}
                      disabled={isLoading}
                      className={cn(
                        'flex items-center justify-center h-11 w-full rounded-input font-body text-[14px] font-semibold transition-all disabled:opacity-60 active:scale-95',
               