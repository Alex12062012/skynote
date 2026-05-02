import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_CONFIG, PLAN_NOVA_ALLOC } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  if (!STRIPE_CONFIG.secretKey || !STRIPE_CONFIG.webhookSecret) {
    return NextResponse.json({ error: 'Stripe non configure' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(STRIPE_CONFIG.secretKey)

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // Service role pour bypasser RLS — le webhook n'a pas de cookies utilisateur
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = session.metadata?.userId
      const plan   = session.metadata?.plan   // 'starter' | 'pro'
      const billing = session.metadata?.billing

      if (!userId || !plan) break

      const expiresAt = new Date()
      if (billing === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }

      // Mettre à jour le plan
      await supabase
        .from('profiles')
        .update({
          plan,
          plan_expires_at:        expiresAt.toISOString(),
          stripe_customer_id:     session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq('id', userId)

      // Créditer les Novas du premier mois
      const novaAmount = PLAN_NOVA_ALLOC[plan as 'starter' | 'pro'] ?? 0
      if (novaAmount > 0) {
        await supabase.rpc('add_novas', {
          p_user_id: userId,
          p_amount:  novaAmount,
          p_reason:  `Abonnement ${plan} activé — ${novaAmount} ✦`,
        })
      }

      // Log transaction coin (rétrocompat)
      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount:  0,
        reason:  `Abonnement ${plan} activé`,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ plan: 'free', plan_expires_at: null })
          .eq('id', profile.id)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any

      // Ignorer la première facture (déjà gérée par checkout.session.completed)
      if (invoice.billing_reason === 'subscription_create') break

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, plan')
        .eq('stripe_customer_id', invoice.customer)
        .single()

      if (profile && profile.plan !== 'free') {
        // Prolonger l'abonnement d'un mois
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
        await supabase
          .from('profiles')
          .update({ plan_expires_at: expiresAt.toISOString() })
          .eq('id', profile.id)

        // Renouveler les Novas mensuelles
        const plan = profile.plan as 'starter' | 'pro' | 'plus' | 'famille'
        const normalizedPlan = (plan === 'plus' ? 'starter' : plan === 'famille' ? 'pro' : plan) as 'starter' | 'pro'
        const novaAmount = PLAN_NOVA_ALLOC[normalizedPlan] ?? 0
        if (novaAmount > 0) {
          await supabase.rpc('add_novas', {
            p_user_id: profile.id,
            p_amount:  novaAmount,
            p_reason:  `Renouvellement ${normalizedPlan} — ${novaAmount} ✦`,
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
