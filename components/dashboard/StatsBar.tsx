'use client'

import { BookOpen, Zap, Flame } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface StatsBarProps { coursesCount: number; qcmCount: number; streak: number; coins: number }

export function StatsBar({ coursesCount, qcmCount, streak, coins }: StatsBarProps) {
  const { t } = useI18n()
  const streakActive = streak >= 2

  const stats = [
    {
      icon: <BookOpen className="h-5 w-5 text-brand dark:text-brand-dark" />,
      value: coursesCount,
      label: t('stats.courses'),
      highlight: false,
    },
    {
      icon: <Zap className="h-5 w-5 text-amber-500" />,
      value: qcmCount,
      label: t('stats.qcmDone'),
      highlight: false,
    },
    {
      icon: (
        <Flame
          className={cn(
            'h-5 w-5',
            streakActive
              ? 'text-orange-500 animate-flame-pulse'
              : 'text-orange-400',
          )}
        />
      ),
      value: streak,
      label: t('stats.streak'),
      highlight: streakActive,
    },
    {
      icon: <SkyCoin size={20} />,
      value: coins,
      label: t('stats.skycoins'),
      highlight: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            'lglass-liquid flex items-center gap-3 rounded-card p-4 animate-card-enter',
            s.highlight && 'ring-1 ring-orange-400/50',
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {s.icon}
          <div>
            <p className={cn(
              'font-display text-[22px] font-bold leading-none',
              s.highlight
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-text-main dark:text-text-dark-main',
            )}>
              {s.value}
            </p>
            <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary mt-0.5">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
