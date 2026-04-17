import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const COINS_PERFECT = 10
const QUIZ_QUESTIONS = 20

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  // Élèves et profs ne gagnent pas de skycoins
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canEarnCoins = profile?.role !== 'student' && profile?.role !== 'teacher'

  const { quizId, score, total } = await req.json() as {
    quizId: string
    score: number
    total: number
  }

  const isPerfect = score === total && total === QUIZ_QUESTIONS
  const coinsEarned = isPerfect ? COINS_PERFECT : 0

  await supabase.from("list_quiz_sessions").insert({
    quiz_id: quizId,
    user_id: user.id,
    score,
    total,
    coins_earned: coinsEarned,
  })

  if (coinsEarned > 0 && canEarnCoins) {
    await supabase.rpc("increment_coins", {
      p_user_id: user.id,
      p_amount: coinsEarned,
    })
  }

  return NextResponse.json({ coinsEarned })
}
