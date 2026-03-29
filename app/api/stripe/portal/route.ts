import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    if (!STRIPE_CONFIG.secretKey) {
      return NextResponse.json({ error: 'Stripe non configure' }, { status: 503 })
    }

    // Recuperer le stripe_customer_id du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement Stripe trouve' }, { status: 404 })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(STRIPE_CONFIG.secretKey)

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: STRIPE_CONFIG.cancelUrl.replace('?payment=cancelled', ''),
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('[Stripe portal]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
