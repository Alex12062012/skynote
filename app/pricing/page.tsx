import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { PricingClient } from '@/components/pricing/PricingClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Forfaits — Skynote' }

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlan = 'free'
  let planExpiresAt: string | null = null
  let hasLSSubscription = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, ls_subscription_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      currentPlan    = profile.plan || 'free'
      planExpiresAt  = profile.plan_expires_at
      hasLSSubscription = !!profile.ls_subscription_id
    }
  }

  return (
    <PricingClient
      currentPlan={currentPlan}
      planExpiresAt={planExpiresAt}
      hasLSSubscription={hasLSSubscription}
      isLoggedIn={!!user}
    />
  )
}
