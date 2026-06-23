'use client'

import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'

const MESSAGES = [
  "L'IA analyse tes fiches de revision...",
  "L'IA redige les questions brevet...",
  "L'IA equilibre les matieres...",
  "L'IA ajuste le niveau 3e...",
  "L'IA verifie la qualite des questions...",
  'Finalisation de ton epreuve...',
]

export function BrevetProcessingLoader({ debugLine }: { debugLine?: string }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [barProgress, setBarProgress] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
      setBarProgress((p) => (p < 88 ? p + 9 : p))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center animate-fade-in">
      <div style={{ perspective: '400px' }}>
        <div style={{ animation: 'brevet-pulse 2s ease-in-out infinite' }}>
          <style>{`
            @keyframes brevet-pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.12); opacity: 0.85; }
            }
          `}</style>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 dark:bg-brand-dark/10">
            <GraduationCap className="h-10 w-10 text-brand dark:text-brand-dark" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-[22px] font-semibold text-text-main dark:text-text-dark-main">
          Preparation de ton epreuve
        </h2>
        <p key={messageIndex} className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary animate-fade-in">
          {MESSAGES[messageIndex]}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
          <div
            className="relative h-full rounded-pill transition-all duration-700 ease-out overflow-hidden"
            style={{ width: `${barProgress}%`, background: 'linear-gradient(90deg, #2563EB, #60A5FA)' }}
          >
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]" />
          </div>
        </div>
        <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary tabular-nums">
          {barProgress}%
        </p>
      </div>

      {debugLine && (
        <p className="max-w-sm rounded-input border border-sky-border bg-sky-surface px-3 py-2 font-mono text-[11px] text-text-tertiary dark:border-night-border dark:bg-night-surface dark:text-text-dark-tertiary">
          {debugLine}
        </p>
      )}
    </div>
  )
}
