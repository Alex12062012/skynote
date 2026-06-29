'use client'

import Link from 'next/link'
import { NovaCoin } from '@/components/ui/NovaCoin'

interface NovaUpgradeWidgetProps {
  plan: string
}

const PLAN_LABELS: Record<string, string> = {
  free:    'Forfait Gratuit',
  starter: 'Forfait Starter',
  pro:     'Forfait Pro',
}

export function NovaUpgradeWidget({ plan }: NovaUpgradeWidgetProps) {
  if (plan === 'pro') return null

  return (
    <div className="lglass fixed bottom-5 left-5 z-30 hidden items-center gap-2 rounded-pill px-3.5 py-1.5 sm:flex">
      <NovaCoin size={15} />
      <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
        {PLAN_LABELS[plan] ?? 'Forfait Gratuit'}
      </span>
      <span className="text-text-tertiary dark:text-text-dark-tertiary">·</span>
      <Link
        href="/pricing"
        className="font-body text-[13px] font-medium text-brand hover:underline dark:text-brand-dark"
      >
        Mettre à niveau
      </Link>
    </div>
  )
}
