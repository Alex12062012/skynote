import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/marketing/LandingPage'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si connecte, redirect vers dashboard
  if (user) redirect('/dashboard')

  // Verifier beta mode
  const { data: beta } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'beta_mode')
    .maybeSingle()

  const isBeta = beta?.value === 'true'

  return <LandingPage isBeta={isBeta} />
}
