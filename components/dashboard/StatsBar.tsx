'use client'

import { BookOpen, Zap, Flame } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { useI18n } from '@/lib/i18n/context'

interface StatsBarProps { coursesCount: number; qcmCount: number; streak: number; coins: number }

export function StatsBar({ coursesCount, qcmCount, streak, coins }: StatsBarProps) {
  const { t } = useI18n()
  const stats = [
    { icon: <BookOpen className="h-5 w-5 text-brand dark:text-brand-dark" />, value: coursesCount, label: t('stats.courses') },
    { icon: <Zap className="h-5 w-5 text-amber-500" />, value: qcmCount, label: t('stats.qcmDone') },
    { icon: <Flame className="h-5 w-5 text-orange-500" />, value: streak, label: t('stats.streak') },
    { icon: <SkyCoin size={20} />, value: coins, label: t('stats.skycoins') },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
          {s.icon}
          <div>
            <p className="font-display text-[22px] font-bold leading-none text-text-main dark:text-text-dark-main">{s.value}</p>
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
