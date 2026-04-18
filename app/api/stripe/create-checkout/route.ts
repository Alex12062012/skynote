import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { plan, billing } = await request.json()
    // plan: 'plus' | 'famille'
    // billing: 'monthly' | 'yearly'

    // Vérifier que Stripe est configuré
    if (!STRIPE_CONFIG.secretKey) {
      return NextResponse.json({
        error: 'Stripe non configuré — ajoute tes clés dans les variables d\'environnement Vercel'
      }, { status: 503 })
    }

    // Import dynamique de Stripe (évite les erreurs si clé vide)
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(STRIPE_CONFIG.secretKey)

    const priceKey = `${plan}_${billing}` as keyof typeof STRIPE_CONFIG.prices
    const priceId = STRIPE_CONFIG.prices[priceKey]

    if (!priceId) {
      return NextResponse.json({ error: 'Prix non configuré dans Stripe' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        plan,
        billing,
      },
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[Stripe checkout]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
