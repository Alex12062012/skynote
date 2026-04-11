import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/marketing/LandingPage"

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  const { data: betaRow } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "beta_mode")
    .maybeSingle()

  // Récupérer les vrais avis positifs depuis la base de données
  let testimonials: { text: string; name: string; grade: string }[] = []
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: feedbacks } = await admin
      .from("feedbacks")
      .select("love, score, profiles(full_name, grade_level)")
      .not("love", "is", null)
      .neq("love", "")
      .gte("score", 7)
      .order("score", { ascending: false })
      .limit(3)

    if (feedbacks && feedbacks.length > 0) {
      testimonials = feedbacks.map((f: any) => ({
        text: f.love,
        name: f.profiles?.full_name?.split(" ")[0] || "Utilisateur",
        grade: f.profiles?.grade_level || "",
      }))
    }
  } catch {}

  return <LandingPage isBeta={betaRow?.value === "true"} testimonials={testimonials} />
}
