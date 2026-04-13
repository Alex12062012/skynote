import { cn } from '@/lib/utils'

// Handles both accented display names AND raw DB values (without accents)
const SUBJECT_COLORS: Record<string, { bg: string; text: string; label?: string }> = {
  // With accents (display labels)
  'Mathématiques':      { bg: 'bg-blue-100 dark:bg-blue-950/30',   text: 'text-blue-700 dark:text-blue-400' },
  'Français':           { bg: 'bg-pink-100 dark:bg-pink-950/30',   text: 'text-pink-700 dark:text-pink-400' },
  'Histoire':           { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  'Géographie':         { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'SVT':                { bg: 'bg-green-100 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400' },
  'Physique':           { bg: 'bg-violet-100 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
  'Chimie':             { bg: 'bg-purple-100 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400' },
  'Anglais':            { bg: 'bg-orange-100 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400' },
  'Espagnol':           { bg: 'bg-red-100 dark:bg-red-950/30',     text: 'text-red-700 dark:text-red-400' },
  'Philosophie':        { bg: 'bg-indigo-100 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400' },
  'Général':            { bg: 'bg-sky-100 dark:bg-sky-950/30',     text: 'text-sky-700 dark:text-sky-400' },
  // Without accents (raw DB values from SubjectSelect)
  'Mathematiques':      { bg: 'bg-blue-100 dark:bg-blue-950/30',   text: 'text-blue-700 dark:text-blue-400',   label: 'Mathématiques' },
  'Francais':           { bg: 'bg-pink-100 dark:bg-pink-950/30',   text: 'text-pink-700 dark:text-pink-400',   label: 'Français' },
  'Histoire-Geographie':{ bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', label: 'Histoire-Géo' },
  'Sciences (SVT)':     { bg: 'bg-green-100 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', label: 'Sciences (SVT)' },
  'Physique-Chimie':    { bg: 'bg-violet-100 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', label: 'Physique-Chimie' },
  'General':            { bg: 'bg-sky-100 dark:bg-sky-950/30',     text: 'text-sky-700 dark:text-sky-400',     label: 'Général' },
}

export function SubjectBadge({ subject, className }: { subject: string; className?: string }) {
  const entry = SUBJECT_COLORS[subject] ?? { bg: 'bg-sky-cloud', text: 'text-brand' }
  const displayLabel = (entry as any).label ?? subject
  return (
    <span className={cn('inline-flex items-center rounded-pill px-2.5 py-0.5 font-body text-[12px] font-medium', entry.bg, entry.text, className)}>
      {displayLabel}
    </span>
  )
}

export function BetaBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-blue-100 px-2.5 py-0.5 font-body text-[11px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
      🧪 Bêta testeur
    </span>
  )
}

export function PlanBadge({ plan }: { plan: string }) {
  if (plan === 'plus') {
    return (
      <a href="/pricing" className="inline-flex items-center gap-1 rounded-pill bg-amber-100 px-3 py-1 font-body text-[12px] font-bold text-amber-700 hover:bg-amber-200 transition-colors dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40 cursor-pointer">
        ⭐ Plus
      </a>
    )
  }
  if (plan === 'famille') {
    return (
      <a href="/pricing" className="inline-flex items-center gap-1 rounded-pill bg-purple-100 px-3 py-1 font-body text-[12px] font-bold text-purple-700 hover:bg-purple-200 transition-colors dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/40 cursor-pointer">
        👨‍👩‍👧 Famille
      </a>
    )
  }
  return (
    <a href="/pricing" className="inline-flex items-center rounded-pill bg-sky-cloud px-3 py-1 font-body text-[12px] font-medium text-text-secondary hover:bg-sky-border transition-colors dark:bg-night-border dark:text-text-dark-secondary dark:hover:bg-night-border/80 cursor-pointer">
      Gratuit →
    </a>
  )
}
