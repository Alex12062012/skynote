import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, action, value } = await request.json()
    const supabase = await createClient()

    switch (action) {
      case 'add_coins': {
        const { data: profile } = await supabase.from('profiles').select('sky_coins').eq('id', userId).single()
        if (!profile) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
        const newCoins = Math.max(0, profile.sky_coins + Number(value))
        await supabase.from('profiles').update({ sky_coins: newCoins }).eq('id', userId)
        await supabase.from('coin_transactions').insert({
          user_id: userId, amount: Number(value),
          reason: `Ajustement admin ${Number(value) > 0 ? '+' : ''}${value} coins`,
        })
        return NextResponse.json({ ok: true, newCoins })
      }

      case 'set_plan': {
        const planExpiry = value === 'premium'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
        await supabase.from('profiles').update({ plan: value, plan_expires_at: planExpiry }).eq('id', userId)
        return NextResponse.json({ ok: true })
      }

      case 'delete_user': {
        // Supprimer toutes les données
        await supabase.from('qcm_attempts').delete().eq('user_id', userId)
        await supabase.from('qcm_questions').delete().eq('user_id', userId)
        await supabase.from('flashcards').delete().eq('user_id', userId)
        await supabase.from('courses').delete().eq('user_id', userId)
        await supabase.from('user_objectives').delete().eq('user_id', userId)
        await supabase.from('coin_transactions').delete().eq('user_id', userId)
        await supabase.from('profiles').delete().eq('id', userId)
        return NextResponse.json({ ok: true })
      }

      case 'set_coins': {
        const coins = Math.max(0, Number(value))
        const { data: profile } = await supabase.from('profiles').select('sky_coins').eq('id', userId).single()
        const diff = coins - (profile?.sky_coins ?? 0)
        await supabase.from('profiles').update({ sky_coins: coins }).eq('id', userId)
        if (diff !== 0) {
          await supabase.from('coin_transactions').insert({
            user_id: userId, amount: diff,
            reason: `Définition admin → ${coins} coins`,
          })
        }
        return NextResponse.json({ ok: true, newCoins: coins })
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
