import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'

/**
 * Administration du message du jour.
 * Même modèle que /api/admin/promo : identité admin revérifiée à chaque appel.
 */

const REWARD_TYPES = ['sky_coins', 'nova'] as const
type RewardType = (typeof REWARD_TYPES)[number]

/** Liste les messages (actifs et passés). */
export async function GET() {
  const auth = await verifyAdmin()
  if (!auth.ok) return auth.res

  const { data, error } = await createAdminClient()
    .from('admin_messages')
    .select('id, content, reward_type, reward_amount, active, created_at, user_seen_messages(count)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const messages = (data ?? []).map((m: any) => ({
    ...m,
    seen_count: m.user_seen_messages?.[0]?.count ?? 0,
    user_seen_messages: undefined,
  }))
  return NextResponse.json({ messages })
}

/** Crée un message (inactif par défaut, sauf `active: true`). */
export async function POST(req: NextRequest) {
  const auth = await verifyAdmin()
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const content = String(body.content ?? '').trim()
  if (content.length < 1 || content.length > 2000) {
    return NextResponse.json({ error: 'Le message doit faire entre 1 et 2000 caractères.' }, { status: 400 })
  }

  let rewardType: RewardType | null = null
  let rewardAmount: number | null = null
  if (body.reward_type) {
    if (!REWARD_TYPES.includes(body.reward_type)) {
      return NextResponse.json({ error: 'Type de récompense invalide.' }, { status: 400 })
    }
    const n = Math.floor(Number(body.reward_amount))
    if (!Number.isFinite(n) || n < 1 || n > 100000) {
      return NextResponse.json({ error: 'Montant de récompense hors bornes (1 à 100 000).' }, { status: 400 })
    }
    rewardType = body.reward_type
    rewardAmount = n
  }

  const admin = createAdminClient()
  const active = Boolean(body.active)

  // Un seul message actif à la fois : activer celui-ci désactive les autres.
  if (active) {
    await admin.from('admin_messages').update({ active: false }).eq('active', true)
  }

  const { data, error } = await admin
    .from('admin_messages')
    .insert({
      content,
      reward_type: rewardType,
      reward_amount: rewardAmount,
      active,
      created_by: auth.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}

/**
 * Active ou désactive un message. On ne supprime jamais : l'historique des
 * récompenses déjà créditées doit rester traçable.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdmin()
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '')
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const admin = createAdminClient()
  const active = Boolean(body.active)

  if (active) {
    await admin.from('admin_messages').update({ active: false }).eq('active', true).neq('id', id)
  }

  const { error } = await admin.from('admin_messages').update({ active }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
