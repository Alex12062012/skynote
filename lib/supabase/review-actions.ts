'use server'

// La page /review (répétition espacée) a été retirée. Ce module ne sert plus
// qu'aux sessions d'évaluation (/eval), qui réutilisent la notation SM-2 pour
// faire progresser les flashcards et attribuer les coins.

import { createClient } from './server'
import { createAdminClient } from './admin'
import { applySM2, GRADE_COINS } from '@/lib/sm2'
import type { SM2Grade } from '@/lib/sm2'

// ============================================================
// submitReview — applique SM-2, enregistre, award coins
// ============================================================

export async function submitReview(
  flashcardId: string,
  grade: SM2Grade
): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  try {
    // Récupérer la carte
    const { data: card } = await supabase
      .from('flashcards')
      .select('ease_factor, interval_days, repetitions')
      .eq('id', flashcardId)
      .eq('user_id', user.id)
      .single()

    if (!card) return { ok: false }

    const result = applySM2(card, grade)

    // Update flashcard — service role (migration 037 : lecture seule cote
    // client), la carte a ete lue avec le filtre user_id.
    await createAdminClient()
      .from('flashcards')
      .update({
        ease_factor: result.ease_factor,
        interval_days: result.interval_days,
        repetitions: result.repetitions,
        next_review_at: result.next_review_at.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        mastery_level: Math.min(5, result.repetitions),
        is_mastered: result.repetitions >= 5 && grade >= 4,
      })
      .eq('id', flashcardId)
      .eq('user_id', user.id)

    // Historique
    await supabase.from('flashcard_reviews').insert({
      flashcard_id: flashcardId,
      user_id: user.id,
      grade,
      interval_before: card.interval_days,
      interval_after: result.interval_days,
      ease_before: card.ease_factor,
      ease_after: result.ease_factor,
    })

    // Coins en fire & forget
    const coins = GRADE_COINS[grade]
    if (coins > 0) {
      createAdminClient().rpc('increment_coins', {
        p_user_id: user.id,
        p_amount: coins,
      }).then(() =>
        supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: coins,
          reason: `Révision SM-2 (grade ${grade})`,
        })
      )
    }

    return { ok: true }
  } catch {
    return { ok: false }
  }
}
