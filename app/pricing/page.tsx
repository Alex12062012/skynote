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
  let hasStripeSubscription = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, stripe_customer_id, stripe_subscription_id, sky_coins')
      .eq('id', user.id)
      .single()

    if (profile) {
      currentPlan = profile.plan || 'free'
      planExpiresAt = profile.plan_expires_at
      hasStripeSubscription = !!profile.stripe_subscription_id
    }
  }

  return (
    <PricingClient
      currentPlan={currentPlan}
      planExpiresAt={planExpiresAt}
      hasStripeSubscription={hasStripeSubscription}
      isLoggedIn={!!user}
    />
  )
}
