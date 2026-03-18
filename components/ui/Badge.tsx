import { cn } from '@/lib/utils'

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  'Mathématiques': { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
  'Français': { bg: 'bg-pink-100 dark:bg-pink-950/30', text: 'text-pink-700 dark:text-pink-400' },
  'Histoire': { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
  'Géographie': { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'SVT': { bg: 'bg-green-100 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400' },
  'Physique': { bg: 'bg-violet-100 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
  'Chimie': { bg: 'bg-purple-100 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400' },
  'Anglais': { bg: 'bg-orange-100 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400' },
  'Espagnol': { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
  'Philosophie': { bg: 'bg-indigo-100 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400' },
  'Général': { bg: 'bg-sky-100 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400' },
}

export function SubjectBadge({ subject, className }: { subject: string; className?: string }) {
  const color = SUBJECT_COLORS[subject] ?? { bg: 'bg-sky-cloud', text: 'text-brand' }
  return (
    <span className={cn('inline-flex items-center rounded-pill px-2.5 py-0.5 font-body text-[12px] font-medium', color.bg, color.text, className)}>
      {subject}
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
  if (plan === 'plus' || plan === 'premium') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-amber-100 px-3 py-1 font-body text-[12px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        ⭐ Plus
      </span>
    )
  }
  if (plan === 'famille') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-purple-100 px-3 py-1 font-body text-[12px] font-bold text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
        👨‍👩‍👧 Famille
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-sky-cloud px-3 py-1 font-body text-[12px] font-medium text-text-secondary dark:bg-night-border dark:text-text-dark-secondary">
      Gratuit
    </span>
  )
}
