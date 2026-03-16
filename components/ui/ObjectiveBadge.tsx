'use client'

import { useEffect, useState } from 'react'
import { SkyCoin } from './SkyCoin'

interface ObjectiveBadgeProps {
  title: string
  icon: string
  coins: number
  visible: boolean
  onHide: () => void
}

export function ObjectiveBadge({ title, icon, coins, visible, onHide }: ObjectiveBadgeProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onHide, 4000)
    return () => clearTimeout(t)
  }, [visible, onHide])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-4 z-50 max-w-xs animate-pop-in sm:right-6">
      <div className="flex items-start gap-3 rounded-card border border-success/20 bg-sky-surface p-4 shadow-2xl dark:border-emerald-800/30 dark:bg-night-surface">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-success-soft text-2xl">
          {icon}
        </div>
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-success dark:text-success-dark">
            Objectif complété !
          </p>
          <p className="font-display text-[15px] font-bold text-text-main dark:text-text-dark-main mt-0.5">
            {title}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <SkyCoin size={16} />
            <span className="font-body text-[13px] font-bold text-brand dark:text-brand-dark">
              +{coins} Sky Coins
            </span>
          </div>
        </div>
        <button
          onClick={onHide}
          className="ml-auto -mt-1 -mr-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-text-tertiary hover:text-text-main dark:hover:text-text-dark-main text-[14px]"
        >
          ×
        </button>
      </div>
    </div>
  )
}
