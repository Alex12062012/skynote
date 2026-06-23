/**
 * Configuration Stripe
 * Remplace les clés vides par tes clés de test Stripe
 * Dashboard Stripe → Développeurs → Clés API
 */

export const STRIPE_CONFIG = {
  // Clés à remplir depuis le dashboard Stripe
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Prix (à créer dans Stripe Dashboard puis coller les IDs)
  prices: {
    starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '', // 4,99€/mois
    starter_yearly:  process.env.STRIPE_PRICE_STARTER_YEARLY  || '', // 3,99€/mois annuel
    pro_monthly:     process.env.STRIPE_PRICE_PRO_MONTHLY     || '', // 6,99€/mois
    pro_yearly:      process.env.STRIPE_PRICE_PRO_YEARLY      || '', // 5,99€/mois annuel
  },

  // URLs de redirection après paiement
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
}

export const PLAN_PRICES = {
  starter: {
    monthly: { amount: 4.99,  label: '4,99€/mois'  },
    yearly:  { amount: 3.99,  label: '3,99€/mois', totalLabel: '47,88€/an'  },
  },
  pro: {
    monthly: { amount: 6.99,  label: '6,99€/mois'  },
    yearly:  { amount: 5.99,  label: '5,99€/mois', totalLabel: '71,88€/an'  },
  },
}

/** Nombre de Novas allouées lors de la souscription / du renouvellement */
export const PLAN_NOVA_ALLOC: Record<'starter' | 'pro', number> = {
  starter: 2000,
  pro:     4000,
}
