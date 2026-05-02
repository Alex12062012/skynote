'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Zap } from 'lucide-react'

interface NovaUpgradeWidgetProps {
  novaBalance: number
  plan: string
}

const PLAN_LABELS: Record<string, string> = {
  free:    'Gratuit',
  starter: 'Starter',
  pro:     'Pro',
  plus:    'Starter',
  famille: 'Pro',
}

const UPGRADE_TEXT: Record<string, { label: string; cta: string }> = {
  free:    { label: 'Rechargez vos Novas chaque mois', cta: 'Passer à Starter' },
  starter: { label: 'Doublez vos Novas avec le plan Pro', cta: 'Passer à Pro' },
  plus:    { label: 'Doublez vos Novas avec le plan Pro', cta: 'Passer à Pro' },
}

export function NovaUpgradeWidget({ novaBalance, plan }: NovaUpgradeWidgetProps) {
  const [dismissed, setDismissed] = useState(false)

  // N'affiche pas pour les pros (plan max) ni si fermé
  const normalizedPlan = plan === 'famille' ? 'pro' : plan === 'plus' ? 'starter' : plan
  if (normalizedPlan === 'pro' || dismissed) return null

  const upgrade = UPGRADE_TEXT[plan] ?? UPGRADE_TEXT.free
  const isLow = novaBalance < 50

  return (
    <div
      className="fixed bottom-5 left-5 z-30 w-[220px] rounded-2xl border border-indigo-200/60 bg-white/90 shadow-xl backdrop-blur-md dark:border-indigo-900/40 dark:bg-night-surface/90"
      style={{ boxShadow: '0 8px 32px 0 rgba(99,102,241,0.13)' }}
    >
      {/* Bouton fermeture */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-text-tertiary hover:text-text-main transition-colors dark:text-text-dark-tertiary dark:hover:text-text-dark-main"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="p-4 pr-7">
        {/* Logo + balance */}
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600">
            <img
              src="/nova-coin.png"
              alt="Nova"
              width={22}
              height={22}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '<span style="color:white;font-size:16px">✦</span>'
              }}
            />
          </div>
          <div>
            <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
              Plan {PLAN_LABELS[plan] ?? 'Gratuit'}
            </p>
            <p
              className="font-display text-[15px] font-bold leading-tight"
              style={{ color: isLow ? '#DC2626' : '#6366f1' }}
            >
              {novaBalance.toLocaleString('fr-FR')} ✦
            </p>
          </div>
        </div>

        {/* Barre de progression visuelle */}
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950/40">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (novaBalance / (normalizedPlan === 'starter' ? 2000 : 600)) * 100)}%` }}
          />
        </div>

        {/* Message upgrade */}
        <p className="mb-3 font-body text-[12px] leading-snug text-text-secondary dark:text-text-dark-secondary">
          {upgrade.label}
        </p>

        {/* CTA */}
        <Link
          href="/pricing"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 font-body text-[12px] font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95"
        >
          <Zap className="h-3.5 w-3.5" />
          {upgrade.cta}
        </Link>
      </div>
    </div>
  )
}
