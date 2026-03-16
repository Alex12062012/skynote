'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

/**
 * Réclamer les coins d'un objectif complété.
 * Retourne le montant crédité et le nouveau solde.
 */
export async function claimObjectiveReward(
  objectiveId: string
): Promise<{ coinsAwarded: number; newBalance: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { coinsAwarded: 0, newBalance: 0, error: 'Non connecté' }

  // Récupérer l'objectif
  const { data: obj } = await supabase
    .from('objectives')
    .select('*')
    .eq('id', objectiveId)
    .single()

  if (!obj) return { coinsAwarded: 0, newBalance: 0, error: 'Objectif introuvable' }

  // Récupérer le user_objective
  const { data: userObj } = await supabase
    .from('user_objectives')
    .select('*')
    .eq('user_id', user.id)
    .eq('objective_id', objectiveId)
    .single()

  if (!userObj?.completed) return { coinsAwarded: 0, newBalance: 0, error: 'Objectif non complété' }
  if (userObj.claimed) return { coinsAwarded: 0, newBalance: 0, error: 'Déjà réclamé' }

  // Marquer comme réclamé
  await supabase
    .from('user_objectives')
    .update({ claimed: true, claimed_at: new Date().toISOString() })
    .eq('id', userObj.id)

  // Créditer les coins
  const { data: profile } = await supabase
    .from('profiles')
    .select('sky_coins')
    .eq('id', user.id)
    .single()

  const currentCoins = profile?.sky_coins ?? 0
  const newBalance = currentCoins + obj.reward_coins

  await supabase
    .from('profiles')
    .update({ sky_coins: newBalance })
    .eq('id', user.id)

  await supabase.from('coin_transactions').insert({
    user_id: user.id,
    amount: obj.reward_coins,
    reason: `Récompense réclamée : ${obj.title} ${obj.icon}`,
  })

  revalidatePath('/objectives')
  revalidatePath('/dashboard')
  revalidatePath('/profile')

  return { coinsAwarded: obj.reward_coins, newBalance }
}
