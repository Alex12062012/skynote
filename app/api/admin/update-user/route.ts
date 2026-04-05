import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    }

    const { userId, action, value } = await request.json()
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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

      case 'set_name': {
        const name = String(value).trim()
        if (!name) return NextResponse.json({ error: 'Nom vide' }, { status: 400 })
        await supabase.from('profiles').update({ full_name: name }).eq('id', userId)
        return NextResponse.json({ ok: true })
      }

      case 'set_plan': {
        const planExpiry = value !== 'free'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null
        await supabase.from('profiles').update({ plan: value, plan_expires_at: planExpiry }).eq('id', userId)
        return NextResponse.json({ ok: true })
      }

      case 'delete_user': {
        // Supprimer les donnees applicatives
        await supabase.from('list_quiz_sessions').delete().eq('user_id', userId)
        await supabase.from('list_quizzes').delete().eq('user_id', userId)
        await supabase.from('qcm_attempts').delete().eq('user_id', userId)
        await supabase.from('qcm_questions').delete().eq('user_id', userId)
        await supabase.from('flashcards').delete().eq('user_id', userId)
        await supabase.from('courses').delete().eq('user_id', userId)
        await supabase.from('user_objectives').delete().eq('user_id', userId)
        await supabase.from('coin_transactions').delete().eq('user_id', userId)
        // Supprimer les donnees classroom si c'est un prof
        const { data: classroom } = await supabase.from('classrooms').select('id').eq('teacher_id', userId).maybeSingle()
        if (classroom) {
          await supabase.from('classroom_students').delete().eq('classroom_id', classroom.id)
          await supabase.from('classrooms').delete().eq('id', classroom.id)
        }
        // Supprimer le profil
        await supabase.from('profiles').delete().eq('id', userId)
        // Supprimer le user de Supabase Auth
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
        if (authDeleteError) {
          return NextResponse.json({ error: `Profil supprime mais erreur auth: ${authDeleteError.message}` }, { status: 500 })
        }
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
            reason: `Definition admin -> ${coins} coins`,
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
