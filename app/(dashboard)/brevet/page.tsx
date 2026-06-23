'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NovaCoin } from '@/components/ui/NovaCoin'
import { NOVA_COST_EXAM_SIMULATION } from '@/lib/supabase/nova-actions'
import { GraduationCap, Lock, Loader2, Star, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

const MENTION_LABELS: Record<string, { label: string; color: string }> = {
  tres_bien:  { label: 'Très Bien',   color: 'text-emerald-400' },
  bien:       { label: 'Bien',         color: 'text-sky-400' },
  assez_bien: { label: 'Assez Bien',   color: 'text-blue-400' },
  passable:   { label: 'Passable',     color: 'text-amber-400' },
  insuffisant:{ label: 'Insuffisant',  color: 'text-red-400' },
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
  const canStart = !hasUsedStarterSession

  async function handleStart() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/brevet/start', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }
      router.push(`/brevet/${data.sessionId}`)
    } catch {
      setError('Erreur réseau. Réessaie dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 dark:bg-brand-dark/10">
          <GraduationCap className="h-8 w-8 text-brand dark:text-brand-dark" />
        </div>
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Mini-épreuve brevet</h1>
        <p className="mt-2 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          20 questions QCM générées depuis tes cours, toutes matières mélangées — comme le vrai brevet.
          Tu obtiens une mention estimée.
        </p>
      </div>

      {/* Infos plan */}
      <div className="mb-6 rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-[13px] font-semibold text-text-main dark:text-text-dark-main">
              {isPro ? 'Pro — épreuves illimitées' : isStarter ? 'Starter — 1 épreuve' : 'Gratuit — sans résultat'}
            </p>
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              {isPro
                ? 'Autant d\'épreuves que tu veux'
                : isStarter
                ? hasUsedStarterSession ? 'Tu as déjà utilisé ton épreuve' : '1 épreuve incluse dans ton plan'
                : 'Passe en Starter pour voir ta mention'}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-pill border border-sky-border bg-sky-surface-2 px-3 py-1.5 dark:border-night-border dark:bg-night-surface-2">
            <NovaCoin size={14} />
            <span className="font-body text-[13px] font-bold text-text-main dark:text-text-dark-main">
              {NOVA_COST_EXAM_SIMULATION} ✦
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      {canStart ? (
        <button
          onClick={handleStart}
          disabled={loading || !dataLoaded}
          className="flex w-full items-center justify-center gap-2 rounded-input bg-brand py-3 font-body text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50 dark:bg-brand-dark dark:text-night-bg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération en cours... (30s)
            </>
          ) : (
            <>
              <GraduationCap className="h-4 w-4" />
              Commencer l'épreuve
            </>
          )}
        </button>
      ) : isStarter && !isPro ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center gap-3 rounded-card border border-amber-200/50 bg-amber-50/30 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
            <Lock className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Tu as déjà utilisé ton épreuve Starter. Passe en Pro pour en faire autant que tu veux.
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

      {/* Historique des épreuves passées */}
      {pastSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-[16px] font-semibold text-text-main dark:text-text-dark-main">
            Mes épreuves précédentes
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
                        {s.score}% — {m?.label ?? s.mention}
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
