import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

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

  // Service role pour bypasser RLS — le webhook n a pas de cookies utilisateur
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      const billing = session.metadata?.billing

      if (!userId || !plan) break

      const expiresAt = new Date()
      if (billing === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }

      await supabase
        .from('profiles')
        .update({
          plan,
          plan_expires_at: expiresAt.toISOString(),
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq('id', userId)

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: 0,
        reason: 'Abonnement ' + (plan === 'plus' ? 'Plus' : 'Famille') + ' active',
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, plan')
        .eq('stripe_customer_id', invoice.customer)
        .single()

      if (profile && profile.plan !== 'free') {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
        await supabase
          .from('profiles')
          .update({ plan_expires_at: expiresAt.toISOString() })
          .eq('id', profile.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
