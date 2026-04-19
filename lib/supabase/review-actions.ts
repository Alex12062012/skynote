'use server'

import { createClient } from './server'
import { applySM2, GRADE_COINS } from '@/lib/sm2'
import type { SM2Grade } from '@/lib/sm2'

const DUE_CARDS_LIMIT = 20

// ============================================================
// TYPES
// ============================================================

export type DueCard = {
  id: string
  title: string
  summary: string
  course_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string | null
}

export type ReviewStats = {
  dueCount: number
  masteredCount: number
  totalCount: number
}

// ============================================================
// getDueCards — 20 cartes à réviser aujourd'hui
// ============================================================

export async function getDueCards(): Promise<DueCard[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const now = new Date().toISOString()

  const { data } = await supabase
    .from('flashcards')
    .select('id, title, summary, course_id, ease_factor, interval_days, repetitions, next_review_at')
    .eq('user_id', user.id)
    .or(`next_review_at.is.null,next_review_at.lte.${now}`)
    .order('next_review_at', { ascending: true, nullsFirst: true })
    .limit(DUE_CARDS_LIMIT)

  return (data as DueCard[]) ?? []
}

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

    // Update flashcard
    await supabase
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
      supabase.rpc('increment_coins', {
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

// ============================================================
// getReviewStats — pour le widget dashboard
// ============================================================

export async function getReviewStats(): Promise<ReviewStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { dueCount: 0, masteredCount: 0, totalCount: 0 }

  const now = new Date().toISOString()

  const [dueRes, masteredRes, totalRes] = await Promise.all([
    supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or(`next_review_at.is.null,next_review_at.lte.${now}`),

    supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_mastered', true),

    supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  return {
    dueCount: dueRes.count ?? 0,
    masteredCount: masteredRes.count ?? 0,
    totalCount: totalRes.count ?? 0,
  }
}
