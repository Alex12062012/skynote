'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Send, Lock, Loader2, Star } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BrevetProcessingLoader } from '@/components/brevet/BrevetProcessingLoader'

interface ExamQuestion {
  matiere: string
  question: string
  options: [string, string, string, string]
}

interface SessionData {
  id: string
  questions: ExamQuestion[]
  answers: (number | null)[]
  status: 'pending' | 'completed'
  plan_snapshot: string
  score: number | null
  mention: string | null
}

const MENTION_LABELS: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  tres_bien:   { label: 'Très Bien',   emoji: '🏆', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  bien:        { label: 'Bien',         emoji: '⭐', color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20' },
  assez_bien:  { label: 'Assez Bien',   emoji: '👍', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  passable:    { label: 'Passable',     emoji: '📝', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  insuffisant: { label: 'Insuffisant',  emoji: '📚', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

export default function BrevetSessionPage() {
  const params = useParams()
  const id = params.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number | null; mention: string | null; correct: number | null; total: number; locked: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    // Chargement initial
    supabase
      .from('exam_sessions')
      .select('id, questions, answers, status, plan_snapshot, score, mention')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) { setError('Session introuvable'); setLoading(false); return }
        const s = data as SessionData
        setSession(s)
        if (s.questions?.length > 0) {
          setAnswers(s.answers ?? new Array(s.questions.length).fill(null))
        }
        if (s.status === 'completed') {
          const isPaid = s.plan_snapshot === 'starter' || s.plan_snapshot === 'pro'
          setResult({
            score: isPaid ? s.score : null,
            mention: isPaid ? s.mention : null,
            correct: null,
            total: s.questions?.length ?? 0,
            locked: !isPaid,
          })
        }
        setLoading(false)
      })

    // Realtime — ecoute les mises a jour (generation IA terminee)
    const channel = supabase
      .channel(`brevet-session-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'exam_sessions', filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as SessionData
          if (Array.isArray(updated.questions) && updated.questions.length > 0) {
            setSession(updated)
            setAnswers(new Array(updated.questions.length).fill(null))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function handleSubmit() {
    if (!session) return
    const unanswered = answers.filter(a => a === null).length
    if (unanswered > 0) {
      const ok = window.confirm(`Tu n'as pas répondu à ${unanswered} question${unanswered > 1 ? 's' : ''}. Soumettre quand même ?`)
      if (!ok) return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/brevet/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, answers }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur lors de la soumission.'); return }
      setResult(data)
      setSession(s => s ? { ...s, status: 'completed' } : s)
    } catch {
      setError('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand dark:text-brand-dark" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-body text-[14px] text-error">{error}</p>
        <Link href="/brevet" className="mt-4 inline-block text-brand hover:underline dark:text-brand-dark">← Retour</Link>
      </div>
    )
  }

  if (!session) return null

  // Questions pas encore generees — afficher le loader
  if (!session.questions || session.questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <BrevetProcessingLoader />
      </div>
    )
  }

  const questions = session.questions
  const q = questions[current]
  const totalAnswered = answers.filter(a => a !== null).length

  // ─── Resultats ─────────────────────────────────────────────────────────────

  if (result) {
    const m = result.mention ? MENTION_LABELS[result.mention] : null

    if (result.locked) {
      return (
        <div className="mx-auto max-w-lg animate-fade-in px-4 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 dark:bg-brand-dark/10">
            <Lock className="h-8 w-8 text-brand dark:text-brand-dark" />
          </div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Épreuve soumise !</h1>
          <p className="mt-2 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Tu as répondu à {result.total} questions. Passe en Starter ou Pro pour voir ta mention estimée.
          </p>
          <Link href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-input bg-brand px-6 py-2.5 font-body text-[14px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg">
            <Star className="h-4 w-4" />
            Voir les plans
          </Link>
          <Link href="/brevet" className="mt-3 block font-body text-[13px] text-text-tertiary hover:underline dark:text-text-dark-tertiary">
            Retour aux épreuves
          </Link>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-lg animate-fade-in px-4 py-10">
        <div className={`rounded-card border p-6 text-center ${m?.bg ?? 'border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface'}`}>
          <p className="mb-2 text-5xl">{m?.emoji ?? '📋'}</p>
          <h1 className="font-display text-h1 font-bold text-text-main dark:text-text-dark-main">{result.score}%</h1>
          <p className={`mt-1 font-display text-h3 font-bold ${m?.color ?? 'text-text-secondary'}`}>
            Mention {m?.label ?? result.mention}
          </p>
          <p className="mt-3 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            {result.correct !== null ? `${result.correct} bonnes réponses sur ${result.total}` : `${result.total} questions`}
          </p>
        </div>

        <div className="mt-4 rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
          <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            💡 Cette mention est une estimation basée sur tes fiches actuelles. Pour t'améliorer, continue à créer des cours et à faire des QCM ciblés.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/courses/new"
            className="flex items-center justify-center gap-2 rounded-input bg-brand py-2.5 font-body text-[14px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg">
            + Créer un nouveau cours
          </Link>
          <Link href="/brevet"
            className="flex items-center justify-center rounded-input border border-sky-border py-2.5 font-body text-[14px] text-text-secondary hover:bg-sky-cloud dark:border-night-border dark:text-text-dark-secondary dark:hover:bg-night-border">
            Retour aux épreuves
          </Link>
        </div>
      </div>
    )
  }

  // ─── Session en cours ───────────────────────────────────────────────────────

  const matieresUniques = [...new Set(questions.map(q => q.matiere))]

  return (
    <div className="mx-auto max-w-xl animate-fade-in px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/brevet" className="flex items-center gap-1 font-body text-[13px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main">
          <ChevronLeft className="h-4 w-4" />
          Quitter
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
            {totalAnswered}/{questions.length} répondues
          </span>
        </div>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-sky-cloud dark:bg-night-border">
        <div className="h-full rounded-full bg-brand transition-all dark:bg-brand-dark"
          style={{ width: `${(totalAnswered / questions.length) * 100}%` }} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {matieresUniques.map(m => {
          const count = questions.filter(q => q.matiere === m).length
          const answered = questions
            .map((q, i) => ({ q, i }))
            .filter(({ q }) => q.matiere === m)
            .filter(({ i }) => answers[i] !== null).length
          return (
            <button key={m}
              onClick={() => {
                const idx = questions.findIndex((q, qi) => q.matiere === m && answers[qi] === null)
                const first = questions.findIndex(q => q.matiere === m)
                setCurrent(idx >= 0 ? idx : first)
              }}
              className={`rounded-pill px-3 py-1 font-body text-[12px] font-semibold transition ${
                answered === count
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  : 'bg-sky-cloud text-text-secondary hover:bg-brand-soft dark:bg-night-border dark:text-text-dark-secondary'
              }`}>
              {m} ({answered}/{count})
            </button>
          )
        })}
      </div>

      <div className="rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
        <p className="mb-1 font-body text-[11px] font-semibold uppercase tracking-widest text-text-tertiary dark:text-text-dark-tertiary">
          {current + 1}/{questions.length} · {q.matiere}
        </p>
        <p className="font-body text-[15px] font-semibold leading-snug text-text-main dark:text-text-dark-main">
          {q.question}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => setAnswers(prev => { const a = [...prev]; a[current] = i; return a })}
              className={`flex items-center gap-3 rounded-input border px-4 py-3 text-left font-body text-[14px] transition ${
                answers[current] === i
                  ? 'border-brand/50 bg-brand/10 font-semibold text-text-main dark:border-brand-dark/50 dark:bg-brand-dark/10 dark:text-text-dark-main'
                  : 'border-sky-border bg-sky-surface-2 text-text-secondary hover:border-brand/30 dark:border-night-border dark:bg-night-surface-2 dark:text-text-dark-secondary'
              }`}>
              <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[12px] font-bold ${
                answers[current] === i
                  ? 'border-brand bg-brand text-white dark:border-brand-dark dark:bg-brand-dark dark:text-night-bg'
                  : 'border-sky-border dark:border-night-border'
              }`}>
                {['A','B','C','D'][i]}
              </span>
              {opt.replace(/^[ABCD]\.\s*/,'').trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 rounded-input border border-sky-border px-4 py-2 font-body text-[13px] text-text-secondary hover:bg-sky-cloud disabled:opacity-30 dark:border-night-border dark:text-text-dark-secondary dark:hover:bg-night-border">
          <ChevronLeft className="h-4 w-4" /> Précédente
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
            className="flex items-center gap-1 rounded-input bg-brand px-4 py-2 font-body text-[13px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg">
            Suivante <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-input bg-emerald-500 px-5 py-2 font-body text-[13px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Soumettre l'épreuve
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-1">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`h-2 w-2 rounded-full transition ${
              i === current ? 'scale-150 bg-brand dark:bg-brand-dark' :
              answers[i] !== null ? 'bg-brand/40 dark:bg-brand-dark/40' :
              'bg-sky-cloud dark:bg-night-border'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 font-body text-[13px] text-error">{error}</p>
      )}
    </div>
  )
}
