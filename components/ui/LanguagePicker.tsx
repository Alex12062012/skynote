'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { LOCALES, type Locale } from '@/lib/i18n/translations'
import { cn } from '@/lib/utils'

interface LanguagePickerProps {
  variant?: 'landing' | 'profile'
}

export function LanguagePicker({ variant = 'landing' }: LanguagePickerProps) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  if (variant === 'profile') {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary">{current.flag} Language</span>
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-input border border-sky-border px-3 py-1.5 text-sm font-medium text-text-main hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-main dark:hover:bg-night-border transition-colors"
          >
            {current.flag} {current.label}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-input border border-sky-border bg-sky-surface shadow-lg dark:border-night-border dark:bg-night-surface">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); setOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                    l.code === locale
                      ? 'bg-brand-soft text-brand font-medium dark:bg-brand-dark-soft dark:text-brand-dark'
                      : 'text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border'
                  )}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(30, 58, 95, 0.6)', border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: 10, padding: '6px 12px', color: '#CBD5E1',
          fontSize: 13, cursor: 'pointer', fontWeight: 500,
        }}
      >
        <Globe style={{ width: 14, height: 14 }} />
        {current.flag} {current.label}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
          background: 'rgba(13, 27, 46, 0.95)', border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: 10, overflow: 'hidden', minWidth: 140,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 14px', border: 'none', cursor: 'pointer',
                fontSize: 13, textAlign: 'left',
                background: l.code === locale ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                color: l.code === locale ? '#60A5FA' : '#CBD5E1',
                fontWeight: l.code === locale ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (l.code !== locale) (e.target as HTMLElement).style.background = 'rgba(96,165,250,0.08)' }}
              onMouseLeave={(e) => { if (l.code !== locale) (e.target as HTMLElement).style.background = 'transparent' }}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
