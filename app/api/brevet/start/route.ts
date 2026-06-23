import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  deductNovas,
  NOVA_COST_EXAM_SIMULATION,
  EXAM_SIMULATION_FREE_MAX,
  EXAM_SIMULATION_STARTER_MAX,
  EXAM_SIMULATION_PRO_SOFT_CAP,
} from '@/lib/supabase/nova-actions'
import { getUserPlanLimits } from '@/lib/supabase/plan'

async function getTotalCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('exam_sessions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
  return count ?? 0
}

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const limits = await getUserPlanLimits(user.id)
  const planSnapshot = limits.isPro ? 'pro' : limits.isStarter ? 'starter' : 'free'

  const sessionCount = await getTotalCount(supabase, user.id)

  if (limits.isPro) {
    if (sessionCount >= EXAM_SIMULATION_PRO_SOFT_CAP) {
      return NextResponse.json(
        { error: 'Nos serveurs sont temporairement surchargés pour les simulations de brevet. Réessaie dans quelques heures.', code: 'server_overloaded' },
        { status: 503 }
      )
    }
  } else if (limits.isStarter) {
    if (sessionCount >= EXAM_SIMULATION_STARTER_MAX) {
      return NextResponse.json(
        { error: 'Tu as déjà utilisé ta simulation brevet Starter. Passe en Pro pour des épreuves illimitées.', code: 'quota_exceeded' },
        { status: 402 }
      )
    }
  } else {
    if (sessionCount >= EXAM_SIMULATION_FREE_MAX) {
      return NextResponse.json(
        { error: 'Tu as déjà utilisé ta simulation brevet gratuite. Passe en Starter pour débloquer tes résultats et recommencer.', code: 'quota_exceeded' },
        { status: 402 }
      )
    }
  }

  const deductResult = await deductNovas(NOVA_COST_EXAM_SIMULATION, 'Épreuve brevet simulée')
  if (!deductResult.ok) {
    return NextResponse.json(
      { error: `Il te faut ${NOVA_COST_EXAM_SIMULATION} ✦ pour lancer une épreuve.`, code: 'insufficient_novas' },
      { status: 402 }
    )
  }

  // Creer la session immediatement avec status='generating'
  // La generation IA sera declenchee en background par le client
  const { data: session, error: insertError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: user.id,
      questions: [],
      answers: [],
      status: 'pending',
      plan_snapshot: planSnapshot,
    })
    .select('id')
    .single()

  if (insertError || !session) {
    return NextResponse.json({ error: 'Erreur lors de la création de la session.' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id })
}
