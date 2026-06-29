import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LS_CONFIG } from '@/lib/lemonsqueezy/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('ls_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.ls_subscription_id) {
      return NextResponse.json({ error: 'Aucun abonnement LemonSqueezy trouvé' }, { status: 404 })
    }

    if (!LS_CONFIG.apiKey) {
      return NextResponse.json({ error: 'LemonSqueezy non configuré' }, { status: 503 })
    }

    // Récupérer l'URL du portail client depuis l'API LS
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${profile.ls_subscription_id}`,
      {
        headers: {
          'Authorization': `Bearer ${LS_CONFIG.apiKey}`,
          'Accept':        'application/vnd.api+json',
        },
      }
    )

    const json = await res.json()

    if (!res.ok) {
      console.error('[LS portal]', json)
      return NextResponse.json({ error: 'Erreur LemonSqueezy' }, { status: 500 })
    }

    const portalUrl = json.data?.attributes?.urls?.customer_portal
      ?? 'https://app.lemonsqueezy.com/my-orders'

    return NextResponse.json({ url: portalUrl })
  } catch (error: any) {
    console.error('[LS portal]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
