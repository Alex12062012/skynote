'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Lock, Loader2, Star, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const MENTION_LABELS: Record<string, { label: string; color: string }> = {
  tres_bien:   { label: 'Tres Bien',   color: 'text-emerald-400' },
  bien:        { label: 'Bien',        color: 'text-sky-400' },
  assez_bien:  { label: 'Assez Bien', color: 'text-blue-400' },
  passable:    { label: 'Passable',    color: 'text-amber-400' },
  insuffisant: { label: 'Insuffisant', color: 'text-red-400' },
}

export default function BrevetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<string>('free')
  const [pastSessions, setPastSessions] = useState<{ id: string; score: number | null; mention: string | null; completed_at: string | null }[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const [profileRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase.from('exam_sessions').select('id, score, mention, completed_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
      setPlan(profileRes.data?.plan ?? 'free')
      setPastSessions(sessionsRes.data ?? [])
      setDataLoaded(true)
    })
  }, [])

  const isPro = plan === 'pro'
  const isStarter = plan === 'starter' || isPro
  const hasUsedStarterSession = !isPro && isStarter && pastSessions.length >= 1
  const hasUsedFreeSession = !isStarter && pastSessions.length >= 1
  const canStart = !hasUsedStarterSession && !hasUsedFreeSession

  async function handleStart() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/brevet/start', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); setLoading(false); return }

      // Declencher la generation IA en background — comme les fiches
      fetch('/api/brevet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: data.sessionId }),
      }).catch(console.error)

      router.push(`/brevet/${data.sessionId}`)
    } catch {
      setError('Erreur reseau. Reessaie dans quelques instants.')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in px-4 py-8">

      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Tableau de bord
      </Link>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 dark:bg-brand-dark/10">
          <GraduationCap className="h-8 w-8 text-brand dark:text-brand-dark" />
        </div>
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Mini-epreuve brevet</h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Simulation basee sur les vraies annales du brevet. Questions generees par IA, corrigees par IA.
          Resultats et mention estimee visibles des Starter.
        </p>
      </div>

      <div className="mb-6 rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-[13px] font-semibold text-text-main dark:text-text-dark-main">
              {isPro ? 'Pro - epreuves illimitees' : isStarter ? 'Starter - 1 epreuve' : 'Gratuit - sans resultat'}
            </p>
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              {isPro
                ? "Autant d'epreuves que tu veux"
                : isStarter
                ? hasUsedStarterSession ? 'Tu as deja utilise ton epreuve' : '1 epreuve incluse dans ton plan'
                : hasUsedFreeSession ? 'Tu as deja utilise ton epreuve gratuite'
                : 'Passe en Starter pour voir ta mention'}
            </p>
          </div>
          <span className="rounded-pill border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-body text-[12px] font-bold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
            Gratuit
          </span>
        </div>
      </div>

      {canStart ? (
        <button
          onClick={handleStart}
          disabled={loading || !dataLoaded}
          className="flex w-full items-center justify-center gap-2 rounded-input bg-brand py-3 font-body text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50 dark:bg-brand-dark dark:text-night-bg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparation de l'epreuve...
            </>
          ) : (
            <>
              <GraduationCap className="h-4 w-4" />
              Commencer l'epreuve
            </>
          )}
        </button>
      ) : isStarter && !isPro ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center gap-3 rounded-card border border-amber-200/50 bg-amber-50/30 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
            <Lock className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Tu as deja utilise ton epreuve Starter. Passe en Pro pour en faire autant que tu veux.
            </p>
          </div>
          <Link href="/pricing"
            className="inline-flex items-center gap-2 rounded-input bg-brand px-6 py-2.5 font-body text-[14px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg">
            <Star className="h-4 w-4" />
            Passer en Pro
          </Link>
        </div>
      ) : null}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-card border border-error/20 bg-error/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />
          <p className="font-body text-[13px] text-error">{error}</p>
        </div>
      )}

      {pastSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-[16px] font-semibold text-text-main dark:text-text-dark-main">
            Mes epreuves precedentes
          </h2>
          <div className="flex flex-col gap-2">
            {pastSessions.map(s => {
              const m = s.mention ? MENTION_LABELS[s.mention] : null
              const date = s.completed_at
                ? new Date(s.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'En cours'
              return (
                <Link key={s.id} href={`/brevet/${s.id}`}
                  className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface px-4 py-3 hover:border-brand transition-colors dark:border-night-border dark:bg-night-surface dark:hover:border-brand-dark">
                  <div>
                    <p className="font-body text-[13px] font-semibold text-text-main dark:text-text-dark-main">{date}</p>
                    {s.score !== null && (
                      <p className={`font-body text-[12px] font-bold ${m?.color ?? 'text-text-secondary'}`}>
                        {s.score}% - {m?.label ?? s.mention}
                      </p>
                    )}
                  </div>
                  <CheckCircle className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
