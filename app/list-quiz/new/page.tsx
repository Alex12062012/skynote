import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ListQuizCreator } from "@/components/list-quiz/ListQuizCreator"

export const metadata = { title: "Nouveau quiz liste — Skynote" }

export default async function NewListQuizPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verifier quota semaine (plan gratuit = 1 cours/semaine toutes methodes confondues)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from("list_quizzes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", weekStart.toISOString())

  // Recuperer le plan de l utilisateur
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  const isPremium = profile?.plan === "premium"
  const weeklyCount = count ?? 0

  return (
    <ListQuizCreator
      userId={user.id}
      isPremium={isPremium}
      weeklyCount={weeklyCount}
    />
  )
}
