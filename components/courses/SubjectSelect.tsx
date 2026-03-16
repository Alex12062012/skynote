'use client'
import { cn } from '@/lib/utils'

const SUBJECTS = ['Mathématiques','Français','Histoire','Géographie','SVT','Physique','Chimie','Anglais','Espagnol','Philosophie','Général']

interface SubjectSelectProps { value: string; onChange: (v: string) => void; error?: string }

export function SubjectSelect({ value, onChange, error }: SubjectSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">Matière</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 w-full appearance-none rounded-input border border-sky-border bg-sky-surface px-4 font-body text-[14px] text-text-main transition-all',
          'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15',
          'dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark',
          !value && 'text-text-tertiary dark:text-text-dark-tertiary',
          error && 'border-error'
        )}
      >
        <option value="">Choisir une matière...</option>
        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {error && <p className="font-body text-[12px] text-error">{error}</p>}
    </div>
  )
}
