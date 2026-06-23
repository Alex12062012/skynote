import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PLAN_NOVA_ALLOC } from '@/lib/stripe/config'

export const maxDuration = 60

/**
 * Cron job — 1er de chaque mois à minuit UTC.
 * Recharge les Novas mensuelles pour tous les abonnés actifs (starter + pro).
 * Gère les abonnements annuels qui ne génèrent qu'une seule facture Stripe/an.
 *
 * Déclenché par Vercel Cron (voir vercel.json).
 * Protégé par le header Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  // Tous les abonnés actifs dont le plan n'a pas expiré
  const { data: subscribers, error } = await supabase
    .from('profiles')
    .select('id, plan, plan_expires_at')
    .in('plan', ['starter', 'pro'])
    .or(`plan_expires_at.is.null,plan_expires_at.gt.${now}`)

  if (error) {
    console.error('[cron/refill-novas] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let credited = 0
  let failed = 0

  for (const profile of subscribers ?? []) {
    const plan = profile.plan as 'starter' | 'pro'
    const amount = PLAN_NOVA_ALLOC[plan] ?? 0
    if (amount === 0) continue

    const { error: rpcError } = await supabase.rpc('add_novas', {
      p_user_id: profile.id,
      p_amount:  amount,
      p_reason:  `Recharge mensuelle ${plan} — ${amount} ✦`,
    })

    if (rpcError) {
      console.error(`[cron/refill-novas] Failed for user ${profile.id}:`, rpcError.message)
      failed++
    } else {
      credited++
    }
  }

  console.log(`[cron/refill-novas] Done — credited: ${credited}, failed: ${failed}`)
  return NextResponse.json({ credited, failed, total: subscribers?.length ?? 0 })
}
