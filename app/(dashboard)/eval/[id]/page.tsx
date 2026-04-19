import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buildEvalPlan, deleteEvaluation } from '@/lib/supabase/eval-actions'
import { Calendar, Brain, CheckCircle, Clock, Trash2, Play } from 'lucide-react'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function daysLeft(examDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const exam = new Date(examDate); exam.setHours(0,0,0,0)
  return Math.round((exam.getTime() - today.getTime()) / 86400000)
}

export default async function EvalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await buildEvalPlan(id)
  if (!plan) redirect('/dashboard')

  const jLeft = daysLeft(plan.eval.exam_date)

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-main dark:text-dark-main">{plan.eval.name}</h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-secondary flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(plan.eval.exam_date)} · {jLeft > 0 ? `J-${jLeft}` : 'Aujourd\'hui'}
          </p>
        </div>
        <form action={async () => {
          'use server'
          await deleteEvaluation(id)
          redirect('/dashboard')
        }}>
          <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition">
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-card bg-sky-surface dark:bg-night-surface p-4 text-center">
          <p className="text-2xl font-bold text-main dark:text-dark-main">{plan.totalCards}</p>
          <p className="text-xs text-text-secondary dark:text-dark-secondary mt-1">Fiches au total</p>
        </div>
        <div className="rounded-card bg-sky-surface dark:bg-night-surface p-4 text-center">
          <p className="text-2xl font-bold text-brand">{plan.days.length}</p>
          <p className="text-xs text-text-secondary dark:text-dark-secondary mt-1">Jours de révision</p>
        </div>
        <div className="rounded-card bg-sky-surface dark:bg-night-surface p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-main dark:text-dark-main">
            {plan.todayIndex !== -1 ? plan.days[plan.todayIndex].cardCount : '—'}
          </p>
          <p className="text-xs text-text-secondary dark:text-dark-secondary mt-1">Fiches aujourd'hui</p>
        </div>
      </div>

      {/* Bouton réviser aujourd'hui */}
      {plan.todayIndex !== -1 && (
        <Link
          href={`/eval/${id}/session`}
          className="inline-flex w-full items-center justify-center gap-2 h-12 rounded-card bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition"
        >
          <Play className="h-4 w-4" />
          Réviser aujourd'hui · {plan.days[plan.todayIndex].cardCount} fiches
        </Link>
      )}

      {/* Planning */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-main dark:text-dark-main">Planning</h2>
        {plan.days.map((day, i) => {
          const isPast = day.date < new Date().toISOString().split('T')[0]
          const isToday = i === plan.todayIndex
          return (
            <div
              key={i}
              className={`flex items-start gap-4 rounded-card border p-4 transition ${
                isToday
                  ? 'border-brand/40 bg-brand/5'
                  : isPast
                  ? 'border-sky-border dark:border-night-border opacity-50'
                  : 'border-sky-border dark:border-night-border bg-sky-surface dark:bg-night-surface'
              }`}
            >
              {/* Icône */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                day.isLastDay
                  ? 'bg-orange-500/20 text-orange-400'
                  : isToday
                  ? 'bg-brand/20 text-brand'
                  : 'bg-white/5 text-text-tertiary dark:text-dark-tertiary'
              }`}>
                {day.isLastDay ? <Brain className="h-4 w-4" /> : isPast ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-main dark:text-dark-main">
                    {day.isLastDay ? 'Révision finale' : `Jour ${day.dayNumber}`}
                    {isToday && <span className="ml-2 text-xs text-brand font-normal">Aujourd'hui</span>}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-text-tertiary dark:text-dark-tertiary">{formatDate(day.date)}</span>
                    <span className="text-xs font-medium text-brand ml-2">{day.cardCount} fiches</span>
                  </div>
                </div>
                {day.tip && (
                  <p className="mt-1 text-xs text-text-secondary dark:text-dark-secondary italic">{day.tip}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
