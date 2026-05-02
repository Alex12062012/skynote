'use client'

import Link from 'next/link'

interface NovaUpgradeWidgetProps {
  plan: string
}

const PLAN_LABELS: Record<string, string> = {
  free:    'Forfait Gratuit',
  starter: 'Forfait Starter',
  pro:     'Forfait Pro',
  plus:    'Forfait Starter',
  famille: 'Forfait Pro',
}

export function NovaUpgradeWidget({ plan }: NovaUpgradeWidgetProps) {
  const normalizedPlan = plan === 'famille' ? 'pro' : plan === 'plus' ? 'starter' : plan
  if (normalizedPlan === 'pro') return null

  return (
    <div className="fixed bottom-5 left-5 z-30 flex items-center gap-2 rounded-pill bg-sky-surface/90 px-4 py-2 shadow-md backdrop-blur-sm border border-sky-border dark:border-night-border dark:bg-night-surface/90">
      <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
        {PLAN_LABELS[plan] ?? 'Forfait Gratuit'}
      </span>
      <span className="text-sky-border dark:text-night-border">·</span>
      <Link
        href="/pricing"
        className="font-body text-[13px] font-medium text-brand hover:underline dark:text-brand-dark"
      >
        Mettre à niveau
      </Link>
    </div>
  )
}
