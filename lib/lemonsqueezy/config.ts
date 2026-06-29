/**
 * Configuration LemonSqueezy
 * Dashboard LS → Settings → API → Clé API
 * Dashboard LS → Webhooks → Ajouter endpoint → Secret
 * Dashboard LS → Store → ID du store (numérique)
 * Dashboard LS → Products → Variants → IDs (numériques)
 */

export const LS_CONFIG = {
  apiKey:        process.env.LEMONSQUEEZY_API_KEY        || '',
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
  storeId:       process.env.LEMONSQUEEZY_STORE_ID       || '',

  // Variant IDs (numériques) à copier depuis le dashboard LS
  variants: {
    starter_monthly: process.env.LS_VARIANT_STARTER_MONTHLY || '',
    starter_yearly:  process.env.LS_VARIANT_STARTER_YEARLY  || '',
    pro_monthly:     process.env.LS_VARIANT_PRO_MONTHLY     || '',
    pro_yearly:      process.env.LS_VARIANT_PRO_YEARLY      || '',
  },

  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
  cancelUrl:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
}

/** Novas créditées à l'activation / renouvellement mensuel */
export const PLAN_NOVA_ALLOC: Record<'starter' | 'pro', number> = {
  starter: 2000,
  pro:     4000,
}
