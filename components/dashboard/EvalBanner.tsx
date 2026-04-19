'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Plus, Brain } from 'lucide-react'
import type { Evaluation } from '@/lib/supabase/eval-actions'

function daysLeft(examDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const exam = new Date(examDate); exam.setHours(0,0,0,0)
  return Math.round((exam.getTime() - today.getTime()) / 86400000)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function EvalBanner({ evals }: { evals: Evaluation[] }) {
  return (
    <div className="flex flex-col gap-2">
      {evals.map(ev => {
        const j = daysLeft(ev.exam_date)
        const urgency =
          j <= 1 ? 'border-red-500/30 bg-red-500/10'
          : j <= 3 ? 'border-orange-500/30 bg-orange-500/10'
          : 'border-brand/30 bg-brand/5'
        const textColor =
          j <= 1 ? 'text-red-300'
          : j <= 3 ? 'text-orange-300'
          : 'text-brand-dark'

        return (
          <Link
            key={ev.id}
            href={`/eval/${ev.id}`}
            className={`flex items-center gap-3 rounded-card border px-4 py-3 transition hover:opacity-90 ${urgency}`}
          >
            <Brain className={`h-5 w-5 shrink-0 ${textColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${textColor}`}>{ev.name}</p>
              <p className="text-xs text-text-tertiary dark:text-dark-tertiary flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {formatDate(ev.exam_date)} · {j > 0 ? `J-${j}` : 'Aujourd\'hui'}
              </p>
            </div>
            <ChevronRight className={`h-4 w-4 shrink-0 opacity-60 ${textColor}`} />
          </Link>
        )
      })}

      <Link
        href="/eval/new"
        className="flex items-center gap-2 rounded-card border border-dashed border-sky-border dark:border-night-border px-4 py-3 text-sm text-text-tertiary dark:text-dark-tertiary hover:border-brand/40 hover:text-brand transition"
      >
        <Plus className="h-4 w-4" />
        Nouvelle évaluation
      </Link>
    </div>
  )
}
