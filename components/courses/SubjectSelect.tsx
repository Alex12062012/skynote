'use client'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface SubjectSelectProps { value: string; onChange: (v: string) => void; error?: string }

export function SubjectSelect({ value, onChange, error }: SubjectSelectProps) {
  const { t } = useI18n()
  const SUBJECTS = [
    { value: 'Mathematiques', label: t('subject.maths') },
    { value: 'Francais', label: t('subject.french') },
    { value: 'Histoire', label: t('subject.history') },
    { value: 'Geographie', label: t('subject.geography') },
    { value: 'SVT', label: t('subject.biology') },
    { value: 'Physique', label: t('subject.physics') },
    { value: 'Chimie', label: t('subject.chemistry') },
    { value: 'Anglais', label: t('subject.english') },
    { value: 'Espagnol', label: t('subject.spanish') },
    { value: 'Philosophie', label: t('subject.philosophy') },
    { value: 'General', label: t('subject.general') },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">{t('newCourse.subject')}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={cn('h-11 w-full appearance-none rounded-input border border-sky-border bg-sky-surface px-4 font-body text-[14px] text-text-main transition-all',
          'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15',
          'dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark',
          !value && 'text-text-tertiary dark:text-text-dark-tertiary', error && 'border-error')}>
        <option value="">{t('newCourse.choosSubject')}</option>
        {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {error && <p className="font-body text-[12px] text-error">{error}</p>}
    </div>
  )
}