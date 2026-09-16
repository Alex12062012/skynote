import { unstable_cache } from "next/cache"
import { createClient, getCachedUser } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { LandingSeyes } from "@/components/marketing/LandingSeyes"

type Testimonial = { text: string; name: string; grade: string }

// Les avis mis en avant changent rarement : caches 1h cote serveur (client
// service role, aucun cookie, donc cacheable). Avant : 1 a 2 requetes
// Supabase a chaque visite anonyme de la landing.
const getTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    try {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      // D'abord chercher les feedbacks marqués "featured" par l'admin
      let { data: feedbacks } = await admin
        .from("feedbacks")
        .select("love, score, featured, profiles(full_name, grade_level)")
        .eq("featured", true)
        .not("love", "is", null)
        .neq("love", "")
        .limit(3)

      // Fallback : si pas assez de featured, compléter avec les meilleurs avis
      if (!feedbacks || feedbacks.length < 3) {
          const { data: topFeedbacks } = await admin
          .from("feedbacks")
          .select("love, score, featured, profiles(full_name, grade_level)")
          .not("love", "is", null)
          .neq("love", "")
          .gte("score", 7)
          .neq("featured", true)
          .order("score", { ascending: false })
          .limit(3 - (feedbacks?.length || 0))
        feedbacks = [...(feedbacks || []), ...(topFeedbacks || [])]
      }

      return (feedbacks ?? []).map((f: any) => ({
        text: f.love,
        name: f.profiles?.full_name?.split(" ")[0] || "Utilisateur",
        grade: f.profiles?.grade_level || "",
      }))
    } catch {
      return []
    }
  },
  ["landing-testimonials"],
  { revalidate: 3600 }
)

export default async function RootPage() {
  // getCachedUser ne contacte Supabase Auth que si un cookie de session existe :
  // un prospect anonyme n'attend plus un aller-retour auth pour rien.
  const user = await getCachedUser()
  if (user) redirect("/dashboard")

  const supabase = await createClient()
  const [{ data: betaRow }, testimonials] = await Promise.all([
    supabase.from("admin_settings").select("value").eq("key", "beta_mode").maybeSingle(),
    getTestimonials(),
  ])

  return <LandingSeyes isBeta={betaRow?.value === "true"} testimonials={testimonials} />
}
