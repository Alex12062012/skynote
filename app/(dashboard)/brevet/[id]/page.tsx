'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronLeft, ChevronRight, Send, Lock, Loader2, Star,
  FileText, X, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankDocument {
  titre: string
  contenu: string
  type: 'texte' | 'tableau' | 'graphique' | 'image' | 'donnees'
}

interface StoredQuestion {
  id: string
  matiere: string
  theme: string
  annee: number
  source: string
  documents?: BankDocument[]
  question: string
}

interface RedactionSubject {
  id: string
  annee: number
  type: 'imagination' | 'reflexion'
  texteSupport?: string
  contexte?: string
  consigne: string
}

interface CorrectionItem {
  questionId: string
  matiere: string
  points: number
  feedback: string
}

interface SessionData {
  id: string
  questions: StoredQuestion[]
  redaction: RedactionSubject | null
  answers: (string | null)[]
  status: 'pending' | 'completed'
  plan_snapshot: string
  score: number | null
  mention: string | null
  corrections: CorrectionItem[] | null
}

// ─── Mentions ─────────────────────────────────────────────────────────────────

const MENTION_LABELS: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  tres_bien:   { label: 'Très Bien',   emoji: '🏆', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  bien:        { label: 'Bien',         emoji: '⭐', color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20' },
  assez_bien:  { label: 'Assez Bien',   emoji: '👍', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  passable:    { label: 'Passable',     emoji: '📝', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  insuffisant: { label: 'Insuffisant',  emoji: '📚', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

const HG_MATIERES = new Set(['Histoire-Géographie', 'EMC'])

// ─── Composant DocumentPanel ──────────────────────────────────────────────────

function DocumentPanel({
  documents,
  activeTab,
  setActiveTab,
}: {
  documents: BankDocument[]
  activeTab: number
  setActiveTab: (i: number) => void
}) {
  if (documents.length === 0) return (
    <div className="flex h-full items-center justify-center">
      <p className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">Aucun document pour cette question.</p>
    </div>
  )

  const doc = documents[activeTab] ?? documents[0]

  return (
    <div className="flex h-full flex-col">
      {/* Onglets */}
      {documents.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-sky-border pb-2 dark:border-night-border">
          {documents.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 rounded-t px-3 py-1.5 font-body text-[12px] font-semibold transition ${
                activeTab === i
                  ? 'bg-brand/10 text-brand dark:bg-brand-dark/10 dark:text-brand-dark'
                  : 'text-text-tertiary hover:text-text-secondary dark:text-text-dark-tertiary'
              }`}
            >
              D{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Contenu du document */}
      <div className="flex-1 overflow-y-auto pt-3">
        <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
          {doc.titre}
        </p>
        {doc.type === 'image' && doc.contenu.startsWith('http') ? (
          <a
            href={doc.contenu}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-card border border-sky-border bg-sky-cloud/50 px-4 py-3 font-body text-[13px] text-brand hover:underline dark:border-night-border dark:bg-night-border/30 dark:text-brand-dark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Voir le document (s'ouvre dans un nouvel onglet)
          </a>
        ) : doc.type === 'image' ? (
          <img
            src={doc.contenu}
            alt={doc.titre}
            className="max-w-full rounded-card border border-sky-border dark:border-night-border"
          />
        ) : doc.type === 'graphique' && doc.contenu.trim().startsWith('<svg') ? (
          <div
            className="w-full overflow-hidden rounded-card border border-sky-border bg-white p-2 dark:border-night-border dark:bg-night-surface"
            dangerouslySetInnerHTML={{ __html: doc.contenu }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-text-main dark:text-text-dark-main">
            {doc.contenu}
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function BrevetSessionPage() {
  const params = useParams()
  const id = params.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number | null
    mention: string | null
    totalSur20: number | null
    corrections: CorrectionItem[] | null
    total: number
    locked: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Panel documents (unifié : même panel pour HG et non-HG)
  const [panelOpen, setPanelOpen] = useState(false)
  const [docActiveTab, setDocActiveTab] = useState(0)
  const [hgDocIndex, setHgDocIndex] = useState(0)
  const [hgDocTab, setHgDocTab] = useState(0)

  // Auto-save drafts
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Chargement ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('exam_sessions')
      .select('id, questions, redaction, answers, status, plan_snapshot, score, mention, corrections')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) { setError('Session introuvable'); setLoading(false); return }
        const s = data as SessionData
        setSession(s)
        if (s.questions?.length > 0) {
          const totalSlots = s.questions.length + 1 // +1 pour rédaction
          const existing = (s.answers ?? []) as (string | null)[]
          setAnswers(existing.length >= totalSlots ? existing : new Array(totalSlots).fill(null))
        }
        if (s.status === 'completed') {
          const isPaid = ['starter', 'pro', 'plus', 'famille'].includes(s.plan_snapshot)
          setResult({
            score: isPaid ? s.score : null,
            mention: isPaid ? s.mention : null,
            totalSur20: null,
            corrections: isPaid ? s.corrections : null,
            total: (s.questions?.length ?? 0) + 1,
            locked: !isPaid,
          })
        }
        setLoading(false)
      })

    // Polling si questions pas encore prêtes
    let attempt = 0
    const poll = setInterval(async () => {
      attempt++
      const { data, error: pollErr } = await supabase
        .from('exam_sessions')
        .select('id, questions, redaction, answers, status, plan_snapshot, score, mention, corrections')
        .eq('id', id)
        .single()

      if (pollErr) {
        if (pollErr.code === 'PGRST116') {
          clearInterval(poll)
          setError('La génération a échoué. Réessaie.')
          setLoading(false)
        }
        return
      }

      const qCount = Array.isArray(data?.questions) ? (data.questions as any[]).length : 0
      if (data && qCount > 0) {
        clearInterval(poll)
        const s = data as SessionData
        setSession(s)
        setAnswers(new Array(s.questions.length + 1).fill(null))
        setLoading(false)
      }

      if (attempt > 30) clearInterval(poll)
    }, 2000)

    return () => { clearInterval(poll) }
  }, [id])

  // Quand on change de question : reset les tabs, mais garder le panel ouvert
  useEffect(() => {
    setDocActiveTab(0)
    setHgDocTab(0)
    // Si on navigue vers une question HG, pointer le panel HG sur cette question
    if (session) {
      const curQ = session.questions[current]
      if (curQ && HG_MATIERES.has(curQ.matiere)) {
        const hgIdx = session.questions
          .filter(q => HG_MATIERES.has(q.matiere) && q.documents?.length)
          .findIndex(q => q.id === curQ.id)
        if (hgIdx >= 0) setHgDocIndex(hgIdx)
      }
    }
  }, [current, session])

  // ── Données dérivées ────────────────────────────────────────────────────────

  const questions = session?.questions ?? []
  const redaction = session?.redaction ?? null

  // Tous les documents HG regroupés par question
  const hgQuestions = questions.filter(q => HG_MATIERES.has(q.matiere) && q.documents?.length)
  const hgAllDocs: { questionLabel: string; docs: BankDocument[] }[] = hgQuestions.map((q, _i) => ({
    questionLabel: `${q.matiere} — ${q.theme}`,
    docs: q.documents ?? [],
  }))

  const isRedactionIndex = current === questions.length
  const q = !isRedactionIndex ? questions[current] : null
  const currentDocs = q?.documents ?? []
  const isHG = q ? HG_MATIERES.has(q.matiere) : false
  const totalAnswered = answers.filter(a => a !== null && a.trim() !== '').length
  const totalSlots = questions.length + 1

  // ── Handlers ────────────────────────────────────────────────────────────────

  function updateAnswer(value: string) {
    setAnswers(prev => {
      const a = [...prev]
      a[current] = value
      return a
    })
  }

  async function handleSubmit() {
    if (!session) return
    const unanswered = answers.filter(a => !a || a.trim() === '').length
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

  // ── États de chargement / erreur ────────────────────────────────────────────

  if (loading || (!loading && !error && questions.length === 0 && !result)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand dark:text-brand-dark" />
        <p className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
          Préparation de l'épreuve…
        </p>
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

  // ── Résultats ────────────────────────────────────────────────────────────────

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
            Tu as répondu à {result.total} questions. Passe en Starter ou Pro pour voir ta mention et les corrections.
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

    const totalSur20 = result.totalSur20 ?? (result.score !== null ? Math.round(result.score * 20 / 100 * 10) / 10 : null)

    return (
      <div className="mx-auto max-w-xl animate-fade-in px-4 py-10">
        <div className={`rounded-card border p-6 text-center ${m?.bg ?? 'border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface'}`}>
          <p className="mb-2 text-5xl">{m?.emoji ?? '📋'}</p>
          <h1 className="font-display text-h1 font-bold text-text-main dark:text-text-dark-main">
            {totalSur20 !== null ? `${totalSur20}/20` : `${result.score}%`}
          </h1>
          <p className={`mt-1 font-display text-h3 font-bold ${m?.color ?? 'text-text-secondary'}`}>
            Mention {m?.label ?? result.mention}
          </p>
        </div>

        {result.corrections && result.corrections.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-display text-[16px] font-semibold text-text-main dark:text-text-dark-main">
              Corrections détaillées
            </h2>
            <div className="flex flex-col gap-2">
              {result.corrections.map((c, i) => (
                <div key={i} className="rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-body text-[12px] font-semibold text-text-tertiary dark:text-text-dark-tertiary">
                      {c.matiere}
                    </span>
                    <span className={`font-body text-[13px] font-bold ${c.points > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {c.points}/{i === result.corrections!.length - 1 ? '3' : '1'} pt
                    </span>
                  </div>
                  {c.feedback && (
                    <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">{c.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

  if (!session) return null

  // ── Session en cours ─────────────────────────────────────────────────────────

  const matieresUniques = [...new Set(questions.map(q => q.matiere))]

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">

      {/* Barre de navigation */}
      <div className="flex-shrink-0 border-b border-sky-border bg-sky-surface px-4 py-3 dark:border-night-border dark:bg-night-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/brevet" className="flex items-center gap-1 font-body text-[13px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main">
            <ChevronLeft className="h-4 w-4" />
            Quitter
          </Link>

          <div className="flex flex-wrap justify-center gap-1">
            {matieresUniques.map(m => {
              const count = questions.filter(q => q.matiere === m).length
              const answered = questions
                .map((q, i) => ({ q, i }))
                .filter(({ q }) => q.matiere === m)
                .filter(({ i }) => answers[i] != null && answers[i]!.trim() !== '').length
              return (
                <button key={m}
                  onClick={() => {
                    const idx = questions.findIndex((q, qi) => q.matiere === m && (!answers[qi] || answers[qi]!.trim() === ''))
                    const first = questions.findIndex(q => q.matiere === m)
                    setCurrent(idx >= 0 ? idx : first)
                  }}
                  className={`rounded-pill px-2.5 py-1 font-body text-[11px] font-semibold transition ${
                    answered === count
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'bg-sky-cloud text-text-secondary hover:bg-brand-soft dark:bg-night-border dark:text-text-dark-secondary'
                  }`}>
                  {m.split(' ')[0]} ({answered}/{count})
                </button>
              )
            })}
            <button
              onClick={() => setCurrent(questions.length)}
              className={`rounded-pill px-2.5 py-1 font-body text-[11px] font-semibold transition ${
                answers[questions.length] != null && answers[questions.length]!.trim() !== ''
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  : current === questions.length
                  ? 'bg-brand/10 text-brand dark:bg-brand-dark/10 dark:text-brand-dark'
                  : 'bg-sky-cloud text-text-secondary hover:bg-brand-soft dark:bg-night-border dark:text-text-dark-secondary'
              }`}>
              Rédaction (3 pts)
            </button>
          </div>

          <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
            {totalAnswered}/{totalSlots}
          </span>
        </div>

        <div className="mx-auto mt-2 max-w-6xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-sky-cloud dark:bg-night-border">
            <div className="h-full rounded-full bg-brand transition-all dark:bg-brand-dark"
              style={{ width: `${(totalAnswered / totalSlots) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Corps split-screen */}
      <div className="flex flex-1 overflow-hidden">

        {/* Gauche — exercice */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-2xl">

            {isRedactionIndex ? (
              <div>
                <p className="mb-1 font-body text-[11px] font-semibold uppercase tracking-widest text-text-tertiary dark:text-text-dark-tertiary">
                  RÉDACTION · 3 pts · {redaction?.annee ?? ''}
                </p>
                <h2 className="mb-1 font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
                  {redaction?.type === 'imagination' ? "Sujet d'imagination" : 'Sujet de réflexion'}
                </h2>
                {redaction?.texteSupport && (
                  <p className="mb-3 font-body text-[13px] italic text-text-secondary dark:text-text-dark-secondary">
                    En lien avec : {redaction.texteSupport}
                  </p>
                )}
                {redaction?.contexte && (
                  <div className="mb-4 rounded-card border border-sky-border bg-sky-cloud/50 p-4 dark:border-night-border dark:bg-night-border/30">
                    <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                      <span className="font-semibold">Contexte :</span> {redaction.contexte}
                    </p>
                  </div>
                )}
                <div className="mb-5 rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
                  <p className="font-body text-[14px] leading-relaxed text-text-main dark:text-text-dark-main">
                    {redaction?.consigne}
                  </p>
                </div>
                <textarea
                  value={answers[questions.length] ?? ''}
                  onChange={e => updateAnswer(e.target.value)}
                  placeholder="Rédigez votre texte ici…"
                  rows={20}
                  className="w-full resize-y rounded-card border border-sky-border bg-white p-4 font-body text-[14px] leading-relaxed text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:placeholder:text-text-dark-tertiary dark:focus:border-brand-dark"
                />
              </div>
            ) : q && (
              <div>
                <p className="mb-1 font-body text-[11px] font-semibold uppercase tracking-widest text-text-tertiary dark:text-text-dark-tertiary">
                  {current + 1}/{questions.length} · {q.matiere} · {q.theme} · {q.annee}
                </p>
                <p className="mb-4 font-body text-[15px] font-semibold leading-snug text-text-main dark:text-text-dark-main">
                  {q.question}
                </p>

                {(isHG ? hgAllDocs.length > 0 : currentDocs.length > 0) && (
                  <button
                    onClick={() => setPanelOpen(v => !v)}
                    className="mb-4 flex items-center gap-1.5 rounded-input border border-sky-border px-3 py-1.5 font-body text-[12px] font-semibold text-text-secondary transition hover:border-brand hover:text-brand dark:border-night-border dark:text-text-dark-secondary dark:hover:border-brand-dark dark:hover:text-brand-dark"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {panelOpen ? 'Masquer le document' : isHG ? `Voir les documents (${currentDocs.length || hgAllDocs.flatMap(h => h.docs).length})` : `Voir le document (${currentDocs.length})`}
                  </button>
                )}

                <p className="mb-3 font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                  Source : {q.source}
                </p>

                <textarea
                  value={answers[current] ?? ''}
                  onChange={e => updateAnswer(e.target.value)}
                  placeholder="Rédigez votre réponse ici…"
                  rows={8}
                  className="w-full resize-y rounded-card border border-sky-border bg-white p-4 font-body text-[14px] leading-relaxed text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:placeholder:text-text-dark-tertiary dark:focus:border-brand-dark"
                />
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="flex items-center gap-1 rounded-input border border-sky-border px-4 py-2 font-body text-[13px] text-text-secondary hover:bg-sky-cloud disabled:opacity-30 dark:border-night-border dark:text-text-dark-secondary dark:hover:bg-night-border">
                <ChevronLeft className="h-4 w-4" /> Précédente
              </button>

              {current < questions.length ? (
                <button
                  onClick={() => setCurrent(c => c + 1)}
                  className="flex items-center gap-1 rounded-input bg-brand px-4 py-2 font-body text-[13px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg">
                  Suivante <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-input bg-emerald-500 px-5 py-2 font-body text-[13px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Correction en cours… (~30s)' : "Soumettre l'épreuve"}
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-1">
              {[...questions, { id: 'redaction' }].map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`h-2 w-2 rounded-full transition ${
                    i === current ? 'scale-150 bg-brand dark:bg-brand-dark' :
                    answers[i] != null && answers[i]!.trim() !== '' ? 'bg-brand/40 dark:bg-brand-dark/40' :
                    'bg-sky-cloud dark:bg-night-border'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="mt-4 font-body text-[13px] text-error">{error}</p>
            )}
          </div>
        </div>

        {/* Droite — panel unifié (HG ou non-HG selon la question courante) */}
        {panelOpen && (
          <div className="w-[42%] flex-shrink-0 overflow-hidden border-l border-sky-border bg-sky-cloud/30 dark:border-night-border dark:bg-night-border/20 flex flex-col">
            {isHG ? (
              /* ── Panel HG : onglets par question HG ── */
              <>
                <div className="flex-shrink-0 flex items-center justify-between border-b border-sky-border px-5 py-3 dark:border-night-border">
                  <p className="font-body text-[13px] font-bold text-text-main dark:text-text-dark-main">
                    Documents Histoire-Géographie
                  </p>
                  <button onClick={() => setPanelOpen(false)} className="rounded p-1 text-text-tertiary hover:text-text-secondary">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {hgAllDocs.length > 1 && (
                  <div className="flex-shrink-0 overflow-x-auto border-b border-sky-border dark:border-night-border">
                    <div className="flex gap-1 p-2">
                      {hgAllDocs.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setHgDocIndex(i); setHgDocTab(0) }}
                          className={`flex-shrink-0 rounded px-2.5 py-1.5 font-body text-[11px] font-semibold transition ${
                            hgDocIndex === i
                              ? 'bg-brand/10 text-brand dark:bg-brand-dark/10 dark:text-brand-dark'
                              : 'text-text-tertiary hover:text-text-secondary dark:text-text-dark-tertiary'
                          }`}
                        >
                          Qst {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-5">
                  {hgAllDocs[hgDocIndex] && (
                    <>
                      <p className="mb-3 font-body text-[11px] font-semibold text-text-tertiary dark:text-text-dark-tertiary">
                        {hgAllDocs[hgDocIndex].questionLabel}
                      </p>
                      <DocumentPanel
                        documents={hgAllDocs[hgDocIndex].docs}
                        activeTab={hgDocTab}
                        setActiveTab={setHgDocTab}
                      />
                    </>
                  )}
                </div>
              </>
            ) : (
              /* ── Panel non-HG : docs de la question courante ── */
              <>
                <div className="flex-shrink-0 flex items-center justify-between border-b border-sky-border px-5 py-3 dark:border-night-border">
                  <p className="font-body text-[12px] font-bold uppercase tracking-widest text-text-tertiary dark:text-text-dark-tertiary">
                    Document
                  </p>
                  <button onClick={() => setPanelOpen(false)} className="rounded p-1 text-text-tertiary hover:text-text-secondary">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <DocumentPanel
                    documents={currentDocs}
                    activeTab={docActiveTab}
                    setActiveTab={setDocActiveTab}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
