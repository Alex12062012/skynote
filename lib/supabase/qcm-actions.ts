'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

export type QcmDifficulty = 'peaceful' | 'easy' | 'medium' | 'hard'

const COINS_BY_DIFFICULTY: Record<QcmDifficulty, number> = {
  peaceful: 1,
  easy: 2,
  medium: 3,
  hard: 5,
}

export interface SaveAttemptInput {
  flashcardId: string
  score: number
  total: number
  answers: number[] // indices des réponses données
  difficulty?: QcmDifficulty
}

/**
 * Sauvegarder une tentative de QCM et attribuer des coins si score parfait
 */
export async function saveQcmAttempt(input: SaveAttemptInput): Promise<{
  coinsEarned: number
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { coinsEarned: 0, error: 'Non connecté' }

  const perfect = input.score === input.total && input.total > 0
  const coinsEarned = perfect ? (COINS_BY_DIFFICULTY[input.difficulty ?? 'medium']) : 0

  // Enregistrer la tentative
  const { error } = await supabase.from('qcm_attempts').insert({
    user_id: user.id,
    flashcard_id: input.flashcardId,
    score: input.score,
    total: input.total,
    perfect,
    coins_earned: coinsEarned,
  })

  if (error) return { coinsEarned: 0, error: error.message }

  // Attribuer des coins si score parfait
  if (perfect && coinsEarned > 0) {
    // Incrémenter les coins du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('sky_coins')
      .eq('id', user.id)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ sky_coins: profile.sky_coins + coinsEarned })
        .eq('id', user.id)

      // Enregistrer la transaction
      const difficultyLabels: Record<QcmDifficulty, string> = { peaceful: 'Paisible', easy: 'Normal', medium: 'Hardcore', hard: 'Teste tes parents' }
    const difficultyLabel = difficultyLabels[input.difficulty ?? 'easy']
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: coinsEarned,
        reason: `Score parfait au QCM ${difficultyLabel}`,
      })
    }
  }

  // Si score parfait → marquer la fiche comme maîtrisée automatiquement
  if (perfect) {
    await supabase.from('flashcards').update({ is_mastered: true }).eq('id', input.flashcardId).eq('user_id', user.id)
    const { data: fc } = await supabase.from('flashcards').select('course_id').eq('id', input.flashcardId).single()
    if (fc) {
      const { data: all } = await supabase.from('flashcards').select('is_mastered').eq('course_id', fc.course_id)
      if (all) {
        const progress = Math.round((all.filter((f: any) => f.is_mastered).length / all.length) * 100)
        await supabase.from('courses').update({ progress }).eq('id', fc.course_id)
      }
    }
  }

  // Vérifier objectif "perfect_qcm_10"
  await checkQcmObjectives(user.id)

  revalidatePath('/objectives')
  revalidatePath('/courses')
  return { coinsEarned, error: null }
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
