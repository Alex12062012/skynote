'use client'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'text', label: 'Texte', icon: '📝' },
  { id: 'pdf', label: 'PDF', icon: '📄' },
  { id: 'photo', label: 'Photo', icon: '📷' },
  { id: 'vocal', label: 'Vocal', icon: '🎙️' },
] as const

type SourceType = 'text' | 'pdf' | 'photo' | 'vocal'

export function SourceTypeTabs({ value, onChange }: { value: SourceType; onChange: (v: SourceType) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">Source du cours</p>
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-input border px-2 py-3 font-body text-[13px] font-medium transition-all',
              value === tab.id
                ? 'border-brand bg-brand-soft text-brand dark:border-brand-dark dark:bg-brand-dark-soft dark:text-brand-dark'
                : 'border-sky-border bg-sky-surface text-text-secondary hover:border-brand/40 dark:border-night-border dark:bg-night-surface dark:text-text-dark-secondary'
            )}>
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
