import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { awardCoins } from '@/lib/supabase/objectives-actions'
import { addNovasForUser } from '@/lib/supabase/nova-actions'

export const dynamic = 'force-dynamic'

/**
 * L'utilisateur a cliqué OK sur le message du jour : on marque « vu » et on
 * crédite la récompense éventuelle — une seule fois par (user, message), la
 * clé primaire composite de user_seen_messages tranche en cas de double clic.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const messageId = String(body?.messageId ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) {
    return NextResponse.json({ error: 'messageId invalide' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Le message doit être actif : on ne crédite pas un message désactivé
  // dont l'id aurait été retenu.
  const { data: message } = await admin
    .from('admin_messages')
    .select('id, reward_type, reward_amount, target_user_id')
    .eq('id', messageId)
    .eq('active', true)
    .maybeSingle()
  // Un message cible sur quelqu'un d'autre n'est ni visible ni acquittable.
  if (!message || (message.target_user_id && message.target_user_id !== user.id)) {
    return NextResponse.json({ error: 'Message introuvable' }, { status: 404 })
  }

  // ignoreDuplicates : si la ligne existait déjà, `inserted` est vide et on ne
  // crédite rien — c'est ce qui rend la récompense idempotente.
  const { data: inserted, error } = await admin
    .from('user_seen_messages')
    .upsert({ user_id: user.id, message_id: messageId }, { onConflict: 'user_id,message_id', ignoreDuplicates: true })
    .select('message_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const firstTime = (inserted?.length ?? 0) > 0
  let rewarded: { type: string; amount: number } | null = null

  if (firstTime && message.reward_type && message.reward_amount) {
    if (message.reward_type === 'sky_coins') {
      await awardCoins(user.id, message.reward_amount, 'Message du jour')
    } else {
      await addNovasForUser(user.id, message.reward_amount, 'Message du jour')
    }
    rewarded = { type: message.reward_type, amount: message.reward_amount }
  }

  return NextResponse.json({ ok: true, rewarded })
}
