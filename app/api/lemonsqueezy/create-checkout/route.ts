import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LS_CONFIG } from '@/lib/lemonsqueezy/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { plan, billing } = await request.json()
    // plan: 'starter' | 'pro'
    // billing: 'monthly' | 'yearly'

    if (!LS_CONFIG.apiKey) {
      return NextResponse.json(
        { error: 'LemonSqueezy non configuré — ajoute tes clés dans les variables d\'environnement Vercel' },
        { status: 503 }
      )
    }

    const variantKey = `${plan}_${billing}` as keyof typeof LS_CONFIG.variants
    const variantId  = LS_CONFIG.variants[variantKey]

    if (!variantId) {
      return NextResponse.json({ error: 'Variant non configuré dans LemonSqueezy' }, { status: 400 })
    }

    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LS_CONFIG.apiKey}`,
        'Content-Type':  'application/vnd.api+json',
        'Accept':        'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email:  user.email,
              custom: { userId: user.id, plan, billing },
            },
            product_options: {
              redirect_url: LS_CONFIG.successUrl,
            },
          },
          relationships: {
            store:   { data: { type: 'stores',   id: LS_CONFIG.storeId } },
            variant: { data: { type: 'variants',  id: variantId         } },
          },
        },
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      console.error('[LS checkout]', json)
      return NextResponse.json({ error: 'Erreur LemonSqueezy' }, { status: 500 })
    }

    return NextResponse.json({ url: json.data.attributes.url })
  } catch (error: any) {
    console.error('[LS checkout]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
