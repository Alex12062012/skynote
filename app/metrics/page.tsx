'use client'

import { useEffect, useState, useRef } from 'react'
import {
  BarChart3, Cloud, Printer, Users, Zap, Calendar, Repeat,
  BookOpen, BookMarked, Target, Trophy, Flame, Pencil, Coins, Settings,
} from 'lucide-react'

const ACCESS_CODE = 'skynote2026'

interface Metrics {
  generatedAt: string
  kpis: {
    totalUsers: number
    dau: number
    wau: number
    dauRate: string
    wauRate: string
    retention7d: string
    totalCourses: number
    totalQcm: number
    perfectQcm: number
    totalFlashcards: number
    avgCoursesPerUser: string
    avgQcmPerUser: string
    perfectRate: string
    avgStreak: string
    planCounts: { free: number; plus: number; famille: number }
    conversionRate: string
    mrr: string
    arr: string
    ltv: string
    avgScore: string
    npsScore: number
    feedbackCount: number
    totalCoins: number
  }
  charts: {
    signups: { date: string; count: number }[]
    qcm: { date: string; count: number }[]
    courses: { date: string; count: number }[]
  }
  feedbacks: { score: number; love: string; missing: string; created_at: string }[]
}

function MiniBar({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-0.5 h-16 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t transition-all"
          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%`, background: color, opacity: d.count > 0 ? 1 : 0.15 }} />
      ))}
    </div>
  )
}

export default function MetricsPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const [manualPlus, setManualPlus] = useState(0)
  const [manualFamille, setManualFamille] = useState(0)

  async function loadMetrics() {
    setLoading(true)
    const res = await fetch('/api/metrics')
    const data = await res.json()
    setMetrics(data)
    setLoading(false)
  }

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (code === ACCESS_CODE) { setUnlocked(true); loadMetrics() }
    else setError('Code incorrect')
  }

  function handlePrint() {
    window.print()
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060D1A] px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600"><BarChart3 className="h-8 w-8 text-white" /></div>
            <h1 className="font-bold text-[24px] text-white">Skynote Metrics</h1>
            <p className="text-[14px] text-slate-400 mt-1">Tableau de bord investisseurs</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="Code d'accès"
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-[16px] text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            {error && <p className="text-[13px] text-red-400">{error}</p>}
            <button type="submit"
              className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-500 transition-colors">
              Accéder →
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading || !metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060D1A]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Chargement des métriques...</p>
        </div>
      </div>
    )
  }

  const k = metrics.kpis

  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page { background: white !important; color: black !important; }
          .card { background: #f8fafc !important; border-color: #e2e8f0 !important; }
          .card p, .card span { color: #1e293b !important; }
        }
      `}</style>

      <div ref={printRef} className="print-page max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600"><Cloud className="h-6 w-6 text-white" /></div>
              <div>
                <h1 className="font-bold text-[28px] text-white">Skynote</h1>
                <p className="text-[13px] text-slate-400">L'IA qui transforme tes cours en révisions</p>
              </div>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">
              Données au {new Date(metrics.generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Confidentiel
            </p>
          </div>
          <button onClick={handlePrint}
            className="no-print flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-[13px] font-medium text-slate-300 hover:bg-slate-800 transition-colors">
            <Printer className="h-4 w-4" /> Exporter PDF
          </button>
        </div>

        {/* Section 1 — Traction */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-4">01 — Traction</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Utilisateurs inscrits', value: k.totalUsers, Icon: Users,    color: 'text-blue-400' },
              { label: 'Actifs aujourd\'hui',    value: k.dau,        sub: `${k.dauRate}% DAU`, Icon: Zap,      color: 'text-emerald-400' },
              { label: 'Actifs cette semaine',   value: k.wau,        sub: `${k.wauRate}% WAU`, Icon: Calendar, color: 'text-purple-400' },
              { label: 'Rétention J+7',          value: `${k.retention7d}%`, Icon: Repeat, color: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="card rounded-xl border border-slate-800 bg-slate-900 p-4">
                <item.Icon className={`h-6 w-6 mb-2 ${item.color}`} />
                <p className={`font-bold text-[28px] leading-none ${item.color}`}>{item.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{item.label}</p>
                {item.sub && <p className="text-[10px] text-slate-500">{item.sub}</p>}
              </div>
            ))}
          </div>

          {/* Courbe inscriptions */}
          <div className="card mt-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-[13px] font-semibold text-white mb-3">Nouvelles inscriptions — 30 derniers jours</p>
            <MiniBar data={metrics.charts.signups} color="#3b82f6" />
            <div className="flex justify-between mt-1">
              <p className="text-[10px] text-slate-500">{metrics.charts.signups[0]?.date}</p>
              <p className="text-[10px] text-slate-500">{metrics.charts.signups[metrics.charts.signups.length - 1]?.date}</p>
            </div>
          </div>
        </section>

        {/* Section 2 — Engagement */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-purple-400 mb-4">02 — Engagement</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Cours créés',           value: k.totalCourses,                              Icon: BookOpen },
              { label: 'QCM faits',             value: k.totalQcm,                                  Icon: Zap },
              { label: 'Moy. cours / user',     value: k.avgCoursesPerUser,                         Icon: BookMarked },
              { label: 'Moy. QCM / user',       value: k.avgQcmPerUser,                             Icon: Target },
              { label: 'Taux de réussite',      value: `${k.perfectRate}%`,                         Icon: Trophy },
              { label: 'Streak moyen',          value: `${k.avgStreak}j`,                           Icon: Flame },
              { label: 'Fiches générées',       value: k.totalFlashcards,                           Icon: Pencil },
              { label: 'Sky Coins distribués',  value: k.totalCoins.toLocaleString('fr-FR'),        Icon: Coins },
            ].map(item => (
              <div key={item.label} className="card rounded-xl border border-slate-800 bg-slate-900 p-4">
                <item.Icon className="h-5 w-5 mb-1 text-slate-400" />
                <p className="font-bold text-[22px] leading-none text-white">{item.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="card rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-[13px] font-semibold text-white mb-3">QCM faits — 30 jours</p>
              <MiniBar data={metrics.charts.qcm} color="#8b5cf6" />
            </div>
            <div className="card rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-[13px] font-semibold text-white mb-3">Cours créés — 30 jours</p>
              <MiniBar data={metrics.charts.courses} color="#f59e0b" />
            </div>
          </div>
        </section>

        {/* Section 3 — Satisfaction */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-4">03 — Satisfaction utilisateurs</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-[11px] text-slate-400 mb-1">Note moyenne</p>
              <p className="font-bold text-[40px] leading-none" style={{ color: parseFloat(k.avgScore) >= 8 ? '#34d399' : '#fbbf24' }}>
                {k.avgScore}
              </p>
              <p className="text-[11px] text-slate-500">/10</p>
            </div>
            <div className="card rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-[11px] text-slate-400 mb-1">NPS Score</p>
              <p className="font-bold text-[40px] leading-none" style={{ color: k.npsScore >= 50 ? '#34d399' : k.npsScore >= 0 ? '#fbbf24' : '#f87171' }}>
                {k.npsScore > 0 ? `+${k.npsScore}` : k.npsScore}
              </p>
              <p className="text-[11px] text-slate-500">Net Promoter Score</p>
            </div>
            <div className="card rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
              <p className="text-[11px] text-slate-400 mb-1">Feedbacks reçus</p>
              <p className="font-bold text-[40px] leading-none text-white">{k.feedbackCount}</p>
              <p className="text-[11px] text-slate-500">depuis le lancement</p>
            </div>
          </div>

          {/* Verbatims */}
          {metrics.feedbacks.filter(f => f.love).slice(0, 3).map((f, i) => (
            <div key={i} className="card mb-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between">
                <p className="text-[13px] text-slate-300 italic">"{f.love}"</p>
                <span className="ml-3 flex-shrink-0 font-bold text-[14px]" style={{ color: f.score >= 8 ? '#34d399' : '#fbbf24' }}>
                  {f.score}/10
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Section 4 — Monétisation */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 mb-4">04 — Monétisation</h2>

          {/* Ajustement manuel — upgrades offerts */}
          <div className="card mb-4 rounded-xl border border-amber-800/30 bg-amber-950/20 p-4 no-print">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-400 mb-3"><Settings className="h-4 w-4" /> Ajustement — Upgrades offerts (non payants)</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[11px] text-slate-400 mb-1 block">Comptes Plus offerts</label>
                <input type="number" min={0} value={manualPlus} onChange={e => setManualPlus(parseInt(e.target.value) || 0)}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-amber-500 focus:outline-none" />
                <p className="text-[10px] text-slate-500 mt-1">= -{(manualPlus * 4.99).toFixed(2)}€/mois</p>
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-slate-400 mb-1 block">Comptes Famille offerts</label>
                <input type="number" min={0} value={manualFamille} onChange={e => setManualFamille(parseInt(e.target.value) || 0)}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-amber-500 focus:outline-none" />
                <p className="text-[10px] text-slate-500 mt-1">= -{(manualFamille * 11.99).toFixed(2)}€/mois</p>
              </div>
            </div>
          </div>

          {(() => {
            const deductPlus = manualPlus * 4.99
            const deductFamille = manualFamille * 11.99
            const realMrr = Math.max(0, parseFloat(k.mrr) - deductPlus - deductFamille)
            const realArr = (realMrr * 12).toFixed(2)
            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'MRR réel', value: `${realMrr.toFixed(2)}€`, sub: `Brut: ${k.mrr}€ — Offerts: ${(deductPlus + deductFamille).toFixed(2)}€`, color: 'text-amber-400' },
                  { label: 'ARR projeté', value: `${realArr}€`, sub: 'Revenu annuel récurrent', color: 'text-amber-300' },
                  { label: 'Taux conversion', value: `${k.conversionRate}%`, sub: 'Gratuit → Payant (Stripe)', color: 'text-emerald-400' },
                  { label: 'LTV estimée', value: `${k.ltv}€`, sub: '12 mois abonnés payants', color: 'text-purple-400' },
                ].map(item => (
                  <div key={item.label} className="card rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className={`font-bold text-[26px] leading-none ${item.color}`}>{item.value}</p>
                    <p className="text-[12px] font-semibold text-white mt-1">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.sub}</p>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Répartition plans */}
          <div className="card mt-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-[13px] font-semibold text-white mb-4">Répartition des plans</p>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 h-4 rounded-pill overflow-hidden flex min-w-32">
                {k.totalUsers > 0 && <>
                  <div className="h-full bg-slate-600" style={{ width: `${(k.planCounts.free / k.totalUsers) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(k.planCounts.plus / k.totalUsers) * 100}%` }} />
                  <div className="h-full bg-purple-500" style={{ width: `${(k.planCounts.famille / k.totalUsers) * 100}%` }} />
                </>}
              </div>
              <div className="flex gap-4 text-[12px] flex-wrap">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-slate-600 inline-block" /> Gratuit ({k.planCounts.free})</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-500 inline-block" /> Plus ({k.planCounts.plus}){manualPlus > 0 && <span className="text-amber-600"> (dont {manualPlus} offerts)</span>}</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-purple-500 inline-block" /> Famille ({k.planCounts.famille}){manualFamille > 0 && <span className="text-purple-600"> (dont {manualFamille} offerts)</span>}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-6 text-center">
          <p className="text-[12px] text-slate-500">
            Skynote — Document confidentiel réservé aux investisseurs · skynote-cloud.vercel.app
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            Données générées le {new Date(metrics.generatedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  )
}
