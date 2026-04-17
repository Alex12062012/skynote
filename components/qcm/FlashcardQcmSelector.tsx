'use client'

import { CheckCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import type { Flashcard } from '@/types/database'

interface FlashcardQcmSelectorProps { flashcards: Flashcard[]; selectedId: string | null; onSelect: (id: string) => void }

export function FlashcardQcmSelector({ flashcards, selectedId, onSelect }: FlashcardQcmSelectorProps) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-body text-label-caps text-text-tertiary dark:text-text-dark-tertiary">{t('selector.chooseCard')}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {flashcards.map((f, i) => {
          const isSelected = selectedId === f.id
          return (
            <button key={f.id} onClick={() => onSelect(f.id)}
              className={cn('flex items-center gap-3 rounded-card-sm border-[1.5px] px-4 py-3 text-left transition-all duration-150',
                isSelected ? 'border-brand bg-brand-soft dark:border-brand-dark dark:bg-brand-dark-soft'
                  : 'border-sky-border bg-sky-surface hover:border-brand/40 dark:border-night-border dark:bg-night-surface dark:hover:border-brand-dark/40')}>
              <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-body text-[13px] font-bold',
                isSelected ? 'bg-brand text-white' : 'bg-sky-cloud text-brand dark:bg-night-border dark:text-brand-dark')}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('font-body text-[14px] font-medium truncate', isSelected ? 'text-brand dark:text-brand-dark' : 'text-text-main dark:text-text-dark-main')}>{f.title}</p>
                {f.is_mastered && <p className="font-body text-[11px] text-success dark:text-success-dark flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {t('selector.mastered')}</p>}
              </div>
              {isSelected && <Zap className="h-4 w-4 text-brand dark:text-brand-dark flex-shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}