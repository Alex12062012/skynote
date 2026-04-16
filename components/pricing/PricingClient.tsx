'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, ArrowLeft, Settings, CreditCard, Calendar } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { cn } from '@/lib/utils'

type Billing = 'monthly' | 'yearly'

const PLANS = [
  {
    id: 'free', name: 'Gratuit', icon: '📚',
    price: { monthly: 0, yearly: 0 },
    description: 'Pour decouvrir Skynote',
    color: 'border-slate-200 dark:border-slate-700',
    features: [
      { text: '1 cours par semaine', ok: true },
      { text: 'Fiches generees par l\'IA', ok: true },
      { text: 'QCM automatiques', ok: true },
      { text: 'Sky Coins & objectifs', ok: true },
      { text: 'Dictee vocale', ok: false },
      { text: 'Chatbot IA par cours', ok: false },
      { text: 'Cours illimites', ok: false },
    ],
  },
  {
    id: 'plus', name: 'Plus', icon: '⭐',
    price: { monthly: 4.99, yearly: 3.99 },
    yearlyTotal: 47.88,
    description: 'Pour les eleves serieux',
    color: 'border-brand dark:border-brand-dark ring-2 ring-brand/20',
    popular: true,
    features: [
      { text: 'Cours illimites', ok: true },
      { text: 'Fiches generees par l\'IA', ok: true },
      { text: 'QCM automatiques', ok: true },
      { text: 'Sky Coins & objectifs', ok: true },
      { text: 'Dictee vocale', ok: true },
      { text: 'Chatbot IA par cours', ok: true },
      { text: 'Acces prioritaire nouveautes', ok: true },
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
      { text: 'Jusqu\'a 6 comptes enfants', ok: true },
      { text: 'Dashboard parent', ok: true },
      { text: 'Navigation entre comptes', ok: true },
      { text: 'Dictee vocale', ok: true },
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
    } catch { alert('Erreur reseau') }
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
    } catch { alert('Erreur reseau') }
    setPortalLoading(false)
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
            {isPaid ? 'Ton abonnement' : 'Choisir son forfait'}
          </h1>
          <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {isPaid ? 'Gere ton abonnement et ta facturation.' : 'Commence gratuitement, evolue quand tu veux.'}
          </p>
        </div>

        {/* Banniere abonnement actif */}
        {isPaid && (
          <div className="mb-8 rounded-card border border-brand/20 bg-brand-soft p-6 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand dark:bg-brand-dark text-white dark:text-night-bg text-xl">
                  {currentPlan === 'famille' ? '👨‍👩‍👧' : '⭐'}
                </div>
                <div>
                  <p className="font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
                    Plan {currentPlan === 'famille' ? 'Famille' : 'Plus'}
                  </p>
                  {planExpiresAt && (
                    <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Renouvellement le {new Date(planExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              {hasStripeSubscription && (
                <button onClick={handleManageSubscription} disabled={portalLoading}
                  className="flex items-center justify-center gap-2 rounded-input border border-sky-border bg-sky-surface px-5 py-2.5 font-body text-[14px] font-medium text-text-main hover:bg-sky-cloud dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:hover:bg-night-border transition-colors disabled:opacity-50">
                  <Settings className="h-4 w-4" />
                  {portalLoading ? 'Chargement...' : 'Gerer mon abonnement'}
                </button>
              )}
            </div>
            {hasStripeSubscription && (
              <p className="mt-3 font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                Modifier le moyen de paiement, changer de forfait ou annuler depuis le portail Stripe.
              </p>
            )}
          </div>
        )}

        {/* Toggle mensuel/annuel */}
        {!isPaid && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-pill border border-sky-border bg-sky-surface p-1 dark:border-night-border dark:bg-night-surface">
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
        )}

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === 'yearly' ? plan.price.yearly : plan.price.monthly
            const isLoading = loadingPlan === plan.id
            const isCurrentPlan = plan.id === currentPlan || (false)
            const canUpgrade = !isCurrentPlan && plan.id !== 'free'
            const isDowngrade = (currentPlan === 'famille' && plan.id === 'plus') || (isPaid && plan.id === 'free')

            return (
              <div key={plan.id} className={cn(
                'relative rounded-card-login border bg-sky-surface p-6 shadow-card dark:bg-night-surface flex flex-col',
                isCurrentPlan ? 'border-brand dark:border-brand-dark ring-2 ring-brand/20 dark:ring-brand-dark/20' : plan.color
              )}>
                {plan.popular && !isPaid && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-pill bg-brand px-4 py-1 font-body text-[12px] font-bold text-white dark:bg-brand-dark dark:text-night-bg">
                      Le plus populaire
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-pill bg-success px-4 py-1 font-body text-[12px] font-bold text-white">
                      Ton plan actuel
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

                <div>
                  {isCurrentPlan ? (
                    <div className="flex items-center justify-center h-11 w-full rounded-input bg-success/10 border border-success/20 font-body text-[14px] font-semibold text-success">
                      Plan actuel
                    </div>
                  ) : plan.id === 'free' ? (
                    <Link href={isLoggedIn ? '/dashboard' : '/signup'}
                      className="flex items-center justify-center h-11 w-full rounded-input border border-sky-border font-body text-[14px] font-semibold text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary transition-colors">
                      {isLoggedIn ? 'Retour au dashboard' : 'Commencer gratuitement'}
                    </Link>
                  ) : isDowngrade ? (
                    <button onClick={handleManageSubscription} disabled={portalLoading}
                      className="flex items-center justify-center h-11 w-full rounded-input border border-sky-border font-body text-[14px] font-semibold text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary transition-colors disabled:opacity-50">
                      {portalLoading ? 'Chargement...' : 'Changer de plan'}
                    </button>
                  ) : (
                    <button onClick={() => handleStripe(plan.id)} disabled={isLoading}
                      className={cn(
                        'flex items-center justify-center h-11 w-full rounded-input font-body text-[14px] font-semibold transition-all disabled:opacity-60',
                        plan.id === 'plus'
                          ? 'bg-brand text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      )}>
                      {isLoading ? 'Chargement...' : 'S\'abonner — ' + price.toFixed(2) + '€/mois'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            ['Comment annuler mon abonnement ?', 'Clique sur "Gerer mon abonnement" ci-dessus. Tu seras redirige vers le portail Stripe ou tu peux annuler en un clic. Ton plan reste actif jusqu\'a la fin de la periode payee.'],
            ['Comment changer de forfait ?', 'Tu peux passer de Plus a Famille (ou l\'inverse) depuis le portail Stripe. Le changement prend effet immediatement avec un prorata.'],
            ['C\'est quoi les Sky Coins ?', 'Monnaie virtuelle gagnee en revisant. 750 coins = 1 mois Plus.'],
            ['Je peux payer avec des Sky Coins ?', 'Oui ! Quand tu as 750 Sky Coins, tu peux activer 1 mois de Plus gratuitement depuis la page Objectifs.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
              <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main mb-1">{q}</p>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">{a}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-body text-[12px] text-text-tertiary">
          Paiement securise par Stripe · Annulation a tout moment ·{' '}
          <Link href="/privacy" className="hover:underline">Politique de confidentialite</Link>
        </p>
      </div>
    </div>
  )
}
