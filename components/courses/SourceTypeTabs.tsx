'use client'
import { cn } from '@/lib/utils'

const ALL_TABS = [
  { id: 'text', label: 'Texte', icon: '📝', premiumOnly: false },
  { id: 'pdf', label: 'PDF', icon: '📄', premiumOnly: false },
  { id: 'photo', label: 'Photo', icon: '📷', premiumOnly: false },
  { id: 'vocal', label: 'Vocal', icon: '🎙️', premiumOnly: true },
] as const

type SourceType = 'text' | 'pdf' | 'photo' | 'vocal'

interface SourceTypeTabsProps {
  value: SourceType
  onChange: (v: SourceType) => void
  vocalEnabled?: boolean
}

export function SourceTypeTabs({ value, onChange, vocalEnabled = true }: SourceTypeTabsProps) {
  const tabs = vocalEnabled ? ALL_TABS : ALL_TABS.filter(t => !t.premiumOnly)

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">Source du cours</p>
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id as SourceType)}
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
      {!vocalEnabled && (
        <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
          🎙️ La dictee vocale est disponible avec le plan Plus ou Famille.
          <a href="/pricing" className="ml-1 text-brand hover:underline dark:text-brand-dark">Voir les plans</a>
        </p>
      )}
    </div>
  )
}
