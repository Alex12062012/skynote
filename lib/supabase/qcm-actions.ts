'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import { saveQcmAttemptV2 } from './gamification-actions'
import type { RewardBreakdown } from '@/lib/gamification/rewards'

import type { QcmDifficulty } from '@/lib/ai/prompts'
export type { QcmDifficulty }

export interface SaveAttemptInput {
  flashcardId: string
  score: number
  total: number
  answers: number[] // indices des réponses données
  difficulty?: QcmDifficulty
}

/**
 * WRAPPER legacy — délègue au moteur gamification v2 pour conserver l'API publique.
 * Renvoie juste `coinsEarned` pour la rétrocompatibilité avec les composants existants.
 * Les nouveaux composants devraient appeler directement `saveQcmAttemptV2`.
 */
export async function saveQcmAttempt(input: SaveAttemptInput): Promise<{
  coinsEarned: number
  reward: RewardBreakdown | null
  error: string | null
}> {
  const res = await saveQcmAttemptV2({
    flashcardId: input.flashcardId,
    score: input.score,
    total: input.total,
    difficulty: input.difficulty ?? 'medium',
  })
  if (res.error) return { coinsEarned: 0, reward: null, error: res.error }

  // Garde la logique objectifs existante (perfect_qcm_10, qcm_50, …)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) await checkQcmObjectives(user.id)
  revalidatePath('/objectives')

  return { coinsEarned: res.reward?.total ?? 0, reward: res.reward, error: null }
}

/**
 * Vérifier et mettre à jour les objectifs liés aux QCM
 */
async function checkQcmObjectives(userId: string) {
  const supabase = await createClient()

  // Compter les QCM parfaits
  const { count: perfectCount } = await supabase
    .from('qcm_attempts')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('perfect', true)

  // Compter le total des QCM répondus
  const { count: totalCount } = await supabase
    .from('qcm_attempts')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)

  const { data: objectives } = await supabase
    .from('objectives')
    .select('*')
    .in('key', ['perfect_qcm_10', 'qcm_50'])

  if (!objectives) return

  for (const obj of objectives) {
    const currentValue =
      obj.key === 'perfect_qcm_10' ? (perfectCount ?? 0) : (totalCount ?? 0)

    const { data: userObj } = await supabase
      .from('user_objectives')
      .select('*')
      .eq('user_id', userId)
      .eq('objective_id', obj.id)
      .single()

    const isCompleted = currentValue >= obj.target_value
    const wasAlreadyCompleted = userObj?.completed ?? false

    if (userObj) {
      await supabase
        .from('user_objectives')
        .update({
          current_value: currentValue,
          completed: isCompleted,
          completed_at: isCompleted && !wasAlreadyCompleted ? new Date().toISOString() : userObj.completed_at,
        })
        .eq('id', userObj.id)
    } else {
      await supabase.from('user_objectives').insert({
        user_id: userId,
        objective_id: obj.id,
        current_value: currentValue,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
    }

    // Récompenser si nouvellement complété
    if (isCompleted && !wasAlreadyCompleted) {
      const { data: profile } = await supabase.from('profiles').select('sky_coins').eq('id', userId).single()
      if (profile) {
        await supabase.from('profiles').update({ sky_coins: profile.sky_coins + obj.reward_coins }).eq('id', userId)
        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: obj.reward_coins,
          reason: `Objectif complete : ${obj.title}`,
        })
      }
    }
  }
}
