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
    plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY || '',       // 4,99€/mois
    plus_yearly: process.env.STRIPE_PRICE_PLUS_YEARLY || '',         // 3,99€/mois annuel
    famille_monthly: process.env.STRIPE_PRICE_FAMILLE_MONTHLY || '', // 11,99€/mois
    famille_yearly: process.env.STRIPE_PRICE_FAMILLE_YEARLY || '',   // 10,99€/mois annuel
  },

  // URLs de redirection après paiement
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
}

export const PLAN_PRICES = {
  plus: {
    monthly: { amount: 4.99, label: '4,99€/mois' },
    yearly: { amount: 3.99, label: '3,99€/mois', totalLabel: '47,88€/an' },
  },
  famille: {
    monthly: { amount: 11.99, label: '11,99€/mois' },
    yearly: { amount: 10.99, label: '10,99€/mois', totalLabel: '131,88€/an' },
  },
}
