'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createEvaluation } from '@/lib/supabase/eval-actions'
import { BookOpen, Calendar, ChevronRight, Loader2 } from 'lucide-react'

type Course = { id: string; title: string; subject: string | null }

export default function NewEvalPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Date min = aujourd'hui + 2
  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  })()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('courses')
        .select('id, title, subject')
        .eq('user_id', user.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .then(({ data }) => setCourses((data as Course[]) ?? []))
    })
  }, [])

  function toggle(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Donne un nom à cette éval')
    if (!examDate) return setError('Choisis la date du contrôle')
    if (selectedIds.length === 0) return setError('Sélectionne au moins un cours')

    startTransition(async () => {
      const result = await createEvaluation(name.trim(), examDate, selectedIds)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(`/eval/${result.id}`)
      }
    })
  }

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <h1 className="font-display text-2xl font-bold text-main dark:text-dark-main mb-6">
        Nouvelle évaluation
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nom */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary dark:text-dark-secondary">
            Nom du contrôle
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex: Contrôle d'histoire — Révolution française"
            className="rounded-input border border-sky-border dark:border-night-border bg-sky-surface dark:bg-night-surface px-4 py-2.5 text-sm text-main dark:text-dark-main placeholder:text-text-tertiary dark:placeholder:text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary dark:text-dark-secondary">
            Date du contrôle
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary dark:text-dark-tertiary" />
            <input
              type="date"
              min={minDate}
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full rounded-input border border-sky-border dark:border-night-border bg-sky-surface dark:bg-night-surface pl-10 pr-4 py-2.5 text-sm text-main dark:text-dark-main focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>

        {/* Cours */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary dark:text-dark-secondary">
            Cours à réviser
          </label>
          {courses.length === 0 ? (
            <p className="text-sm text-text-tertiary dark:text-dark-tertiary">Aucun cours disponible</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {courses.map(course => {
                const selected = selectedIds.includes(course.id)
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => toggle(course.id)}
                    className={`flex items-center gap-3 rounded-card border px-4 py-3 text-left transition ${
                      selected
                        ? 'border-brand/50 bg-brand/10 text-main dark:text-dark-main'
                        : 'border-sky-border dark:border-night-border bg-sky-surface dark:bg-night-surface text-text-secondary dark:text-dark-secondary hover:border-brand/30'
                    }`}
                  >
                    <BookOpen className={`h-4 w-4 shrink-0 ${selected ? 'text-brand' : 'text-text-tertiary dark:text-dark-tertiary'}`} />
                    <span className="text-sm font-medium truncate">{course.title}</span>
                    {course.subject && (
                      <span className="ml-auto text-xs text-text-tertiary dark:text-dark-tertiary shrink-0">{course.subject}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-input bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 transition"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Créer le planning
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
