import { createClient } from "@/lib/supabase/server"
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

  return <LandingPage isBeta={betaRow?.value === "true"} />
}
