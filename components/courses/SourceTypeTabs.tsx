'use client'

import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

type SourceType = 'text' | 'photo' | 'list' | 'vocal'

interface SourceTypeTabsProps {
  value: SourceType
  onChange: (v: SourceType) => void
  vocalEnabled?: boolean
}

export function SourceTypeTabs({ value, onChange, vocalEnabled = true }: SourceTypeTabsProps) {
  const { t } = useI18n()
  const ALL_TABS = [
    { id: 'text' as const, label: t('newCourse.text'), icon: '\uD83D\uDCDD', premiumOnly: false },
    { id: 'photo' as const, label: t('newCourse.photo'), icon: '\uD83D\uDCF7', premiumOnly: false },
    { id: 'list' as const, label: t('newCourse.list'), icon: '\uD83D\uDCCB', premiumOnly: false },
    { id: 'vocal' as const, label: t('newCourse.vocal'), icon: '\uD83C\uDFA4', premiumOnly: true },
  ]
  const tabs = vocalEnabled ? ALL_TABS : ALL_TABS.filter(t => !t.premiumOnly)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">{t('newCourse.sourceType')}</p>
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)}
            className={cn('flex flex-1 flex-col items-center gap-1 rounded-input border px-2 py-3 font-body text-[13px] font-medium transition-all',
              value === tab.id ? 'border-brand bg-brand-soft text-brand dark:border-brand-dark dark:bg-brand-dark-soft dark:text-brand-dark'
                : 'border-sky-border bg-sky-surface text-text-secondary hover:border-brand/40 dark:border-night-border dark:bg-night-surface dark:text-text-dark-secondary')}>
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      {!vocalEnabled && (
        <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
          {t('newCourse.vocalPremium')} <a href="/pricing" className="ml-1 text-brand hover:underline dark:text-brand-dark">{t('newCourse.seePlans')}</a>
        </p>
      )}
    </div>
  )
}