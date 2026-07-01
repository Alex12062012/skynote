import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LS_CONFIG, PLAN_NOVA_ALLOC } from '@/lib/lemonsqueezy/config'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Service role — bypass RLS (le webhook n'a pas de cookies utilisateur)
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  if (!LS_CONFIG.webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret non configuré' }, { status: 503 })
  }

  const body      = await request.text()
  const signature = request.headers.get('x-signature') ?? ''

  // Vérifier signature HMAC-SHA256
  const hash = crypto
    .createHmac('sha256', LS_CONFIG.webhookSecret)
    .update(body)
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const payload   = JSON.parse(body)
  const eventName = payload.meta?.event_name as string
  const custom    = payload.meta?.custom_data ?? {}
  const attrs     = payload.data?.attributes  ?? {}
  const subId     = String(payload.data?.id ?? '')

  const supabase = getAdmin()

  // ─── Idempotence ────────────────────────────────────────────────────────
  // LemonSqueezy peut renvoyer le même événement plusieurs fois (timeout,
  // cold start Vercel, erreur réseau côté LS qui déclenche un retry).
  // Sans ce garde-fou, un replay de "subscription_created" recrédite les
  // Novas une deuxième fois pour le même paiement.
  // Le corps du webhook est strictement identique entre l'original et les
  // retries → un hash du body brut sert de clé de dédup fiable, sans avoir
  // besoin d'un ID d'événement dédié que LemonSqueezy ne fournit pas.
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
  const eventKey = `lemonsqueezy:${bodyHash}`

  const { error: dedupError } = await supabase
    .from('webhook_events')
    .insert({ id: eventKey, provider: 'lemonsqueezy', event_name: eventName })

  if (dedupError) {
    // Code 23505 = violation de contrainte unique → déjà traité, on sort en 200
    // sans reprocesser (sinon LS considère l'échec et continue de retry en boucle).
    if (dedupError.code === '23505') {
      return NextResponse.json({ received: true, deduped: true })
    }
    // Table absente (migration 028 pas encore appliquée) → on ne bloque pas
    // le paiement pour autant, mais on log fort pour ne pas rater le fix.
    console.error('[LS webhook] Idempotency check failed (table manquante ?):', dedupError.message)
  }

  switch (eventName) {

    // ─── Abonnement créé (premier paiement) ───────────────────────────────
    case 'subscription_created': {
      const userId  = custom.userId as string | undefined
      const plan    = custom.plan   as string | undefined
      if (!userId || !plan) break

      // renews_at = prochaine date de renouvellement
      const expiresAt = attrs.renews_at
        ? new Date(attrs.renews_at)
        : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d })()

      const { error: updateErr } = await supabase.from('profiles').update({
        plan,
        plan_expires_at:    expiresAt.toISOString(),
        ls_customer_id:     String(attrs.customer_id ?? ''),
        ls_subscription_id: subId,
      }).eq('id', userId)

      // CRITIQUE : ne jamais avaler cette erreur en silence. Un échec ici
      // (contrainte CHECK, RLS, colonne manquante...) veut dire que le client
      // a payé mais que son plan n'a pas été activé — c'est le pire état
      // possible et il doit être visible dans les logs immédiatement.
      if (updateErr) {
        console.error('[LS webhook] ECHEC update profiles (paiement encaisse, plan NON active):', {
          userId, plan, error: updateErr.message,
        })
        break
      }

      const novaAmount = PLAN_NOVA_ALLOC[plan as 'starter' | 'pro'] ?? 0
      if (novaAmount > 0) {
        await supabase.rpc('add_novas', {
          p_user_id: userId,
          p_amount:  novaAmount,
          p_reason:  `Abonnement ${plan} activé — ${novaAmount} ✦`,
        })
      }

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount:  0,
        reason:  `Abonnement ${plan} activé`,
      })
      break
    }

    // ─── Abonnement annulé ou expiré ──────────────────────────────────────
    case 'subscription_cancelled':
    case 'subscription_expired': {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('ls_subscription_id', subId)
        .single()

      if (profile) {
        await supabase.from('profiles')
          .update({ plan: 'free', plan_expires_at: null })
          .eq('id', profile.id)
      }
      break
    }

    // ─── Renouvellement payé ──────────────────────────────────────────────
    case 'subscription_payment_success': {
      // data.type = "subscription-invoices"
      // subscription ID dans les relations
      const renewedSubId = String(
        payload.data?.relationships?.subscription?.data?.id ?? ''
      )
      if (!renewedSubId) break

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, plan')
        .eq('ls_subscription_id', renewedSubId)
        .single()

      if (profile && profile.plan !== 'free') {
        // Récupérer la nouvelle date de renouvellement
        const nextDate = attrs.next_payment_date
          ? new Date(attrs.next_payment_date)
          : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d })()

        await supabase.from('profiles')
          .update({ plan_expires_at: nextDate.toISOString() })
          .eq('id', profile.id)

        const plan        = profile.plan as 'starter' | 'pro'
        const novaAmount  = PLAN_NOVA_ALLOC[plan] ?? 0
        if (novaAmount > 0) {
          await supabase.rpc('add_novas', {
            p_user_id: profile.id,
            p_amount:  novaAmount,
            p_reason:  `Renouvellement ${plan} — ${novaAmount} ✦`,
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
