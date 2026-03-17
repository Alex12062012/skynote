'use client'

import { useState, useEffect } from 'react'
import { Users, BookOpen, Zap, Trophy, DollarSign, LogOut, Search, Trash2, RefreshCw, X, ChevronUp } from 'lucide-react'

const STORAGE_KEY = 'skynote_admin_pin'

interface Stats {
  totalUsers: number; totalCourses: number; totalQcm: number; perfectQcm: number
  totalFlashcards: number; estimatedApiCost: string; totalCoinsDistributed: number
  avgCoursesPerUser: string; avgQcmPerUser: string
}
interface TimeSeries { date: string; count: number }
interface User {
  id: string; email: string; full_name: string | null; sky_coins: number
  plan: string; streak_days: number; created_at: string; last_login_at: string | null
  is_beta_tester?: boolean
}

type Period = '7' | '30' | 'all'
type ChartKey = 'signups' | 'qcm' | 'courses' | 'coins' | 'avgQcm' | null

const CHART_CONFIG: Record<string, { label: string; color: string; unit?: string }> = {
  signups: { label: 'Inscriptions', color: '#60A5FA' },
  qcm: { label: 'QCM faits', color: '#34D399' },
  courses: { label: 'Cours créés', color: '#FBBF24' },
  coins: { label: 'Coins distribués', color: '#A78BFA' },
  avgQcm: { label: 'Moy. QCM / élève', color: '#F87171', unit: '/j' },
}

function MiniChart({ data, color, height = 40 }: { data: TimeSeries[]; color: string; height?: number }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%`, background: color, opacity: d.count > 0 ? 0.9 : 0.15 }} />
      ))}
    </div>
  )
}

function BigChart({ data, color, label, period }: { data: TimeSeries[]; color: string; label: string; period: Period }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const total = data.reduce((s, d) => s + d.count, 0)
  const avg = data.length > 0 ? (total / data.filter(d => d.count > 0).length || 0).toFixed(1) : '0'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-slate-400">Total sur la période</p>
          <p className="font-bold text-[28px] text-white">{total}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-slate-400">Moyenne / jour actif</p>
          <p className="font-bold text-[28px] text-white">{avg}</p>
        </div>
      </div>

      {/* Graphique barres */}
      <div className="flex items-end gap-1 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1 group">
            <div className="relative w-full">
              {d.count > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-700 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                  {d.count}
                </div>
              )}
              <div className="w-full rounded-t transition-all"
                style={{ height: `${Math.max((d.count / max) * 160, d.count > 0 ? 6 : 2)}px`, background: color, opacity: d.count > 0 ? 1 : 0.15 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Labels dates */}
      <div className="flex gap-1">
        {data.filter((_, i) => {
          const step = data.length <= 7 ? 1 : data.length <= 30 ? 5 : 30
          return i % step === 0 || i === data.length - 1
        }).map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="text-[9px] text-slate-500">
              {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'stats' | 'users' | 'feedbacks' | 'settings'>('stats')
  const [period, setPeriod] = useState<Period>('7')
  const [stats, setStats] = useState<Stats | null>(null)
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeries[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [topUsers, setTopUsers] = useState<User[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [avgScore, setAvgScore] = useState('0')
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<ChartKey>(null)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [coinAmount, setCoinAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinFeedback, setPinFeedback] = useState('')
  const [betaEnabled, setBetaEnabled] = useState(true)
  const [betaLoading, setBetaLoading] = useState(false)

  useEffect(() => { loadData(); loadFeedbacks(); loadBeta() }, [period])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stats?period=${period}`)
      const data = await res.json()
      setStats(data.stats)
      setUsers(data.recentUsers)
      setTopUsers(data.topUsers)
      setTimeSeries(data.timeSeries || {})
    } catch {}
    setLoading(false)
  }

  async function loadFeedbacks() {
    try {
      const res = await fetch('/api/admin/feedbacks')
      const data = await res.json()
      setFeedbacks(data.feedbacks)
      setAvgScore(data.avgScore)
    } catch {}
  }

  async function loadBeta() {
    try {
      const res = await fetch('/api/admin/beta')
      const data = await res.json()
      setBetaEnabled(data.enabled)
    } catch {}
  }

  async function toggleBeta() {
    setBetaLoading(true)
    try {
      const res = await fetch('/api/admin/beta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !betaEnabled }) })
      const data = await res.json()
      setBetaEnabled(data.enabled)
    } catch {}
    setBetaLoading(false)
  }

  async function doAction(userId: string, action: string, value?: any) {
    setActionLoading(true); setFeedback('')
    try {
      const res = await fetch('/api/admin/update-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action, value }) })
      const data = await res.json()
      if (data.ok) { setFeedback('✓ Action effectuée'); loadData(); if (action === 'delete_user') setSelectedUser(null) }
      else setFeedback(`Erreur : ${data.error}`)
    } catch { setFeedback('Erreur réseau') }
    setActionLoading(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  function savePin() {
    if (newPin.length < 4) { setPinFeedback('Code trop court (min 4 caractères)'); return }
    localStorage.setItem(STORAGE_KEY, newPin)
    setPinFeedback('✓ Code mis à jour — reconnecte-toi')
    setNewPin('')
    setTimeout(() => { onLogout() }, 2000)
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name?.toLowerCase().includes(search.toLowerCase()))
  )

  // KPI Cards data
  const kpiCards = [
    { key: 'signups' as ChartKey, icon: <Users className="h-5 w-5" />, label: 'Utilisateurs', value: stats?.totalUsers ?? 0, color: '#60A5FA' },
    { key: 'courses' as ChartKey, icon: <BookOpen className="h-5 w-5" />, label: 'Cours créés', value: stats?.totalCourses ?? 0, color: '#FBBF24' },
    { key: 'qcm' as ChartKey, icon: <Zap className="h-5 w-5" />, label: 'QCM faits', value: stats?.totalQcm ?? 0, color: '#34D399' },
    { key: 'avgQcm' as ChartKey, icon: <Trophy className="h-5 w-5" />, label: 'Moy. QCM/élève', value: stats?.avgQcmPerUser ?? '0', color: '#F87171' },
    { key: 'coins' as ChartKey, icon: <span className="text-base">🪙</span>, label: 'Coins distribués', value: stats?.totalCoinsDistributed ?? 0, color: '#A78BFA' },
    { key: null, icon: <DollarSign className="h-5 w-5" />, label: 'Coût API ($)', value: `$${stats?.estimatedApiCost ?? '0'}`, color: '#6EE7B7' },
    { key: null, icon: <BookOpen className="h-5 w-5" />, label: 'Cours/utilisateur', value: stats?.avgCoursesPerUser ?? '0', color: '#FCA5A5' },
    { key: null, icon: <Trophy className="h-5 w-5" />, label: 'Scores parfaits', value: stats?.perfectQcm ?? 0, color: '#C4B5FD' },
  ]

  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌟</span>
          <div>
            <h1 className="font-bold text-[18px]">Skynote Admin</h1>
            <p className="text-[12px] text-slate-400">Panel de gestion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[13px] text-slate-300 hover:bg-slate-800">
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[13px] text-slate-300 hover:bg-slate-800">
            <LogOut className="h-3.5 w-3.5" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-6">
        {[['stats', '📊 Statistiques'], ['users', '👥 Utilisateurs'], ['feedbacks', '💬 Feedbacks'], ['settings', '⚙️ Paramètres']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${tab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {/* Sélecteur de période */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-slate-400">Période :</span>
              {([['7', '7 jours'], ['30', '30 jours'], ['all', 'Tout']] as [Period, string][]).map(([p, l]) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                  {l}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* KPI Cards — cliquables */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {kpiCards.map((card) => {
                    const isActive = activeChart === card.key && card.key !== null
                    const series = card.key ? timeSeries[card.key] : null
                    return (
                      <div key={card.label}
                        onClick={() => card.key && setActiveChart(activeChart === card.key ? null : card.key)}
                        className={`rounded-xl border p-4 transition-all ${card.key ? 'cursor-pointer hover:border-slate-600' : ''} ${isActive ? 'border-blue-500 bg-slate-800' : 'border-slate-800 bg-slate-900'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div style={{ color: card.color }}>{card.icon}</div>
                          {card.key && <ChevronUp className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isActive ? 'rotate-180' : ''}`} />}
                        </div>
                        <p className="font-bold text-[24px] text-white leading-none">{card.value}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{card.label}</p>
                        {series && series.length > 0 && (
                          <div className="mt-2">
                            <MiniChart data={series} color={card.color} height={28} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Graphique agrandi au clic */}
                {activeChart && timeSeries[activeChart] && (
                  <div className="rounded-xl border border-blue-500/30 bg-slate-900 p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-[16px] text-white">
                        {CHART_CONFIG[activeChart]?.label} — {period === '7' ? '7 derniers jours' : period === '30' ? '30 derniers jours' : 'Tout'}
                      </h3>
                      <button onClick={() => setActiveChart(null)} className="text-slate-500 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <BigChart
                      data={timeSeries[activeChart]}
                      color={CHART_CONFIG[activeChart]?.color}
                      label={CHART_CONFIG[activeChart]?.label}
                      period={period}
                    />
                  </div>
                )}

                {/* Top utilisateurs */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="font-semibold text-[15px] mb-4 text-white">🏆 Top 10 — Sky Coins</h3>
                  <div className="space-y-2">
                    {topUsers.map((u, i) => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-slate-500 w-5">{i + 1}</span>
                          <div>
                            <p className="text-[14px] font-medium text-white">{u.full_name || 'Anonyme'}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(u as any).is_beta_tester && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-400">🧪</span>}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${u.plan === 'premium' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>{u.plan}</span>
                          <span className="font-bold text-[14px] text-blue-400">{u.sky_coins} 🪙</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-4 text-[14px] text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <span className="text-[13px] text-slate-400">{filteredUsers.length} utilisateurs</span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    {['Utilisateur', 'Plan', 'Coins', 'Streak', 'Inscrit', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-[14px] font-medium text-white">{u.full_name || 'Anonyme'}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                          {u.is_beta_tester && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-400 flex-shrink-0">🧪 Bêta</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${u.plan === 'premium' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>{u.plan}</span>
                      </td>
                      <td className="px-4 py-3"><span className="font-bold text-[14px] text-blue-400">{u.sky_coins}</span></td>
                      <td className="px-4 py-3"><span className="text-[14px] text-orange-400">🔥 {u.streak_days}j</span></td>
                      <td className="px-4 py-3"><span className="text-[13px] text-slate-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedUser(u)} className="rounded-lg bg-blue-600/20 px-3 py-1 text-[12px] font-medium text-blue-400 hover:bg-blue-600/40">Gérer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal utilisateur */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-[18px] text-white">{selectedUser.full_name || 'Anonyme'}</h3>
                      <p className="text-[13px] text-slate-400">{selectedUser.email}</p>
                      {selectedUser.is_beta_tester && <span className="text-[11px] text-blue-400">🧪 Bêta testeur</span>}
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white text-xl">×</button>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-800 p-4">
                      <p className="text-[12px] text-slate-400 mb-1">Sky Coins actuels</p>
                      <p className="font-bold text-[24px] text-blue-400">{selectedUser.sky_coins} 🪙</p>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Ajouter / retirer des coins</p>
                      <div className="flex gap-2">
                        <input type="number" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} placeholder="Ex: 50 ou -20"
                          className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none" />
                        <button onClick={() => doAction(selectedUser.id, 'add_coins', coinAmount)} disabled={actionLoading || !coinAmount}
                          className="px-4 rounded-xl bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50">Appliquer</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Définir exactement</p>
                      <div className="flex gap-2">
                        <input type="number" placeholder="Ex: 100"
                          className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none"
                          onChange={(e) => setCoinAmount(e.target.value)} />
                        <button onClick={() => doAction(selectedUser.id, 'set_coins', coinAmount)} disabled={actionLoading || !coinAmount}
                          className="px-4 rounded-xl bg-slate-700 text-[13px] font-semibold text-white hover:bg-slate-600 disabled:opacity-50">Définir</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Plan</p>
                      <div className="flex gap-2">
                        <button onClick={() => doAction(selectedUser.id, 'set_plan', 'free')} disabled={actionLoading}
                          className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-colors ${selectedUser.plan === 'free' ? 'bg-slate-600 text-white' : 'border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                          Gratuit
                        </button>
                        <button onClick={() => doAction(selectedUser.id, 'set_plan', 'premium')} disabled={actionLoading}
                          className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-colors ${selectedUser.plan === 'premium' ? 'bg-amber-600 text-white' : 'border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                          ⭐ Premium
                        </button>
                      </div>
                    </div>
                    {feedback && <p className={`text-[13px] font-medium ${feedback.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{feedback}</p>}
                    <button onClick={() => { if (confirm(`Supprimer ${selectedUser.email} ?`)) doAction(selectedUser.id, 'delete_user') }} disabled={actionLoading}
                      className="w-full h-10 rounded-xl border border-red-900/50 bg-red-950/20 text-[13px] font-semibold text-red-400 hover:bg-red-950/40 disabled:opacity-50 flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" /> Supprimer ce compte
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FEEDBACKS TAB ── */}
        {tab === 'feedbacks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-[12px] text-slate-400 mb-1">Note moyenne</p>
                <p className="font-bold text-[36px]" style={{ color: parseFloat(avgScore) >= 8 ? '#34D399' : parseFloat(avgScore) >= 6 ? '#FBBF24' : '#F87171' }}>
                  {avgScore}<span className="text-[16px] text-slate-500">/10</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-[12px] text-slate-400 mb-1">Total feedbacks</p>
                <p className="font-bold text-[36px] text-white">{feedbacks.length}</p>
              </div>
            </div>
            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Aucun feedback pour l&apos;instant</div>
              ) : feedbacks.map((f: any) => (
                <div key={f.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-medium text-white">{f.profiles?.full_name || 'Anonyme'}</p>
                      <p className="text-[11px] text-slate-400">{f.profiles?.email}{f.profiles?.is_beta_tester && <span className="text-blue-400"> · 🧪 Bêta</span>}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.milestone && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{f.milestone} QCM</span>}
                      <span className="font-bold text-[20px]" style={{ color: f.score >= 8 ? '#34D399' : f.score >= 6 ? '#FBBF24' : '#F87171' }}>{f.score}/10</span>
                    </div>
                  </div>
                  {f.love && <div className="mb-2"><p className="text-[11px] text-emerald-400 font-semibold mb-1">✓ Ce qu&apos;il aime</p><p className="text-[13px] text-slate-300">{f.love}</p></div>}
                  {f.missing && <div><p className="text-[11px] text-amber-400 font-semibold mb-1">⚠ Ce qui manque</p><p className="text-[13px] text-slate-300">{f.missing}</p></div>}
                  <p className="text-[11px] text-slate-500 mt-2">{new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="max-w-md space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[15px] text-white">Mode Bêta Testing</h3>
                  <p className="text-[13px] text-slate-400 mt-1">
                    {betaEnabled ? '🟢 Activé — les nouveaux inscrits reçoivent le badge Bêta testeur' : '🔴 Désactivé — inscription normale'}
                  </p>
                </div>
                <button onClick={toggleBeta} disabled={betaLoading}
                  className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${betaEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${betaEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-semibold text-[15px] text-white mb-1">Changer le code d&apos;accès</h3>
              <p className="text-[13px] text-slate-400 mb-4">Minimum 4 caractères. Tu seras déconnecté après le changement.</p>
              <div className="flex gap-2">
                <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Nouveau code"
                  className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none" />
                <button onClick={savePin} className="px-4 rounded-xl bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-500">Sauvegarder</button>
              </div>
              {pinFeedback && <p className={`mt-2 text-[13px] ${pinFeedback.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{pinFeedback}</p>}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-semibold text-[15px] text-white mb-3">Infos du panel</h3>
              <div className="space-y-2 text-[13px]">
                {[['URL d\'accès', '/lexo'], ['Session', '2 heures'], ['Code par défaut', '253912']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-white font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
