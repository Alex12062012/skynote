'use client'

<<<<<<< HEAD
=======
import { FileText, File, Camera, Mic } from 'lucide-react'
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

<<<<<<< HEAD
type SourceType = 'text' | 'photo' | 'list' | 'vocal'
=======
const ALL_TABS = [
  { id: 'text',  label: 'Texte', Icon: FileText, premiumOnly: false },
  { id: 'pdf',   label: 'PDF',   Icon: File,     premiumOnly: false },
  { id: 'photo', label: 'Photo', Icon: Camera,   premiumOnly: false },
  { id: 'vocal', label: 'Vocal', Icon: Mic,      premiumOnly: true  },
] as const

type SourceType = 'text' | 'pdf' | 'photo' | 'vocal'
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)

interface SourceTypeTabsProps {
  value: SourceType
  onChange: (v: SourceType) => void
  vocalEnabled?: boolean
}

export function SourceTypeTabs({ value, onChange, vocalEnabled = true }: SourceTypeTabsProps) {
<<<<<<< HEAD
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
=======
  const tabs = vocalEnabled ? ALL_TABS : ALL_TABS.filter((t) => !t.premiumOnly)

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
        Source du cours
      </p>
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.Icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id as SourceType)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-input border px-2 py-3 font-body text-[13px] font-medium transition-all',
                value === tab.id
                  ? 'border-brand bg-brand-soft text-brand dark:border-brand-dark dark:bg-brand-dark-soft dark:text-brand-dark'
                  : 'border-sky-border bg-sky-surface text-text-secondary hover:border-brand/40 dark:border-night-border dark:bg-night-surface dark:text-text-dark-secondary'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      {!vocalEnabled && (
        <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
          La dictée vocale est disponible avec le plan Plus ou Famille.{' '}
          <a href="/pricing" className="text-brand hover:underline dark:text-brand-dark">
            Voir les plans
          </a>
>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
        </p>
      )}
    </div>
  )
}