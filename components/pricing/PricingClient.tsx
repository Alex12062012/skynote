'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, ArrowLeft, Settings, Calendar, BookOpen, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type Billing = 'monthly' | 'yearly'

const PLANS = [
  {
    id: 'free', name: 'Gratuit',
    price: { monthly: 0, yearly: 0 },
    description: 'Pour découvrir Skynote',
    color: 'border-slate-200 dark:border-slate-700',
    novas: '600 ✦ offerts',
    features: [
      { text: '600 Novas ✦ offerts',        ok: true  },
      { text: 'Fiches générées par l\'IA',   ok: true  },
      { text: 'QCM automatiques',            ok: true  },
      { text: 'Sky Coins & objectifs',       ok: true  },
      { text: 'Dictée vocale',               ok: false },
      { text: 'Chatbot IA par cours',        ok: false },
      { text: 'Recharge mensuelle de Novas', ok: false },
    ],
  },
  {
    id: 'starter', name: 'Starter',
    price: { monthly: 4.99, yearly: 3.99 },
    yearlyTotal: 47.88,
    description: 'Pour les élèves sérieux',
    color: 'border-brand dark:border-brand-dark ring-2 ring-brand/20',
    popular: true,
    novas: '2 000 ✦ / mois',
    features: [
      { text: '2 000 Novas ✦ / mois',       ok: true },
      { text: 'Fiches générées par l\'IA',   ok: true },
      { text: 'QCM automatiques',            ok: true },
      { text: 'Sky Coins & objectifs',       ok: true },
      { text: 'Dictée vocale',               ok: true },
      { text: 'Chatbot IA par cours',        ok: true },
      { text: 'Accès prioritaire nouveautés', ok: true },
    ],
  },
  {
    id: 'pro', name: 'Pro',
    price: { monthly: 6.99, yearly: 5.99 },
    yearlyTotal: 71.88,
    description: 'Pour aller plus loin',
    color: 'border-violet-400 dark:border-violet-500',
    novas: '4 000 ✦ / mois',
    features: [
      { text: '4 000 Novas ✦ / mois',       ok: true },
      { text: 'Fiches générées par l\'IA',   ok: true },
      { text: 'QCM automatiques',            ok: true },
      { text: 'Sky Coins & objectifs',       ok: true },
      { text: 'Dictée vocale',               ok: true },
      { text: 'Chatbot IA par cours',        ok: true },
      { text: 'Support prioritaire',         ok: true },
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

  const isPaid = currentPlan === 'starter' || currentPlan === 'pro'

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
    } catch { alert('Erreur réseau') }
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
    } catch { alert('Erreur réseau') }
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
            {isPaid
              ? 'Gère ton abonnement et ta facturation.'
              : 'Les Novas ✦ alimentent toutes les fonctionnalités IA — fiches, QCM, chatbot.'}
          </p>
        </div>

        {/* Bannière abonnement actif */}
        {isPaid && (
          <div className="mb-8 rounded-card border border-brand/20 bg-brand-soft p-6 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand dark:bg-brand-dark text-white dark:text-night-bg">
                  {currentPlan === 'pro'
                    ? <Zap className="h-6 w-6" />
                    : <Star className="h-6 w-6 fill-current" />}
                </div>
                <div>
                  <p className="font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
                    Plan {currentPlan === 'pro' ? 'Pro' : 'Starter'}
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
                  {portalLoading ? 'Chargement...' : 'Gérer mon abonnement'}
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
            const isCurrentPlan = plan.id === currentPlan
            const isDowngrade = (currentPlan === 'pro' && plan.id === 'starter') || (isPaid && plan.id === 'free')

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
                    {plan.id === 'free'    && <BookOpen className="h-6 w-6 text-text-secondary dark:text-text-dark-secondary" />}
                    {plan.id === 'starter' && <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />}
                    {plan.id === 'pro'     && <Zap className="h-6 w-6 text-violet-500" />}
                    <h2 className="font-display text-[22px] font-bold text-text-main dark:text-text-dark-main">{plan.name}</h2>
                  </div>
                  <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mb-1">{plan.description}</p>
                  {/* Badge Novas */}
                  <span className="inline-flex items-center gap-1 rounded-pill bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-0.5 font-body text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                    {plan.novas}
                  </span>
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
                        plan.id === 'starter'
                          ? 'bg-brand text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg'
                          : 'bg-violet-500 text-white hover:bg-violet-600'
                      )}>
                      {isLoading ? 'Chargement...' : `S'abonner — ${price.toFixed(2)}€/mois`}
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
            ['C\'est quoi les Novas ✦ ?', 'Les Novas sont la monnaie qui alimente les fonctionnalités IA : OCR (2✦), fiches (30✦), QCM (88✦), chatbot (36✦). Ils ne s\'expirent pas et s\'accumulent.'],
            ['Comment annuler mon abonnement ?', 'Clique sur "Gérer mon abonnement" ci-dessus. Tu seras redirigé vers le portail Stripe où tu peux annuler en un clic. Ton plan reste actif jusqu\'à la fin de la période payée.'],
            ['Comment changer de forfait ?', 'Tu peux passer de Starter à Pro (ou l\'inverse) depuis le portail Stripe. Le changement prend effet immédiatement avec un prorata.'],
            ['Je peux gagner des Novas autrement ?', 'Oui ! La roue de la fortune en boutique peut donner des Novas ✦. Tu peux aussi en gagner via les objectifs de fidélité.'],
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
