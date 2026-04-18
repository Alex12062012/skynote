'use client'

import { useState, useEffect } from 'react'
import {
  Users, BookOpen, Zap, Trophy, DollarSign, LogOut, Search, Trash2, RefreshCw, X, ChevronUp,
  Star, UserX, Coins, Flame, Sparkles, BarChart3, MessageCircle, Settings,
  FlaskConical, Check, AlertTriangle, Circle,
} from 'lucide-react'

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

interface StatModal {
  title: string
  users: any[]
  columns: { key: string; label: string; render?: (u: any) => string }[]
}

const CHART_CONFIG: Record<string, { label: string; color: string }> = {
  signups: { label: 'Inscriptions', color: '#60A5FA' },
  qcm: { label: 'QCM faits', color: '#34D399' },
  courses: { label: 'Cours créés', color: '#FBBF24' },
  coins: { label: 'Coins distribués', color: '#A78BFA' },
  avgQcm: { label: 'Moy. QCM / élève', color: '#F87171' },
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
  const avg = (total / (data.filter(d => d.count > 0).length || 1)).toFixed(1)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><p className="text-[13px] text-slate-400">Total</p><p className="font-bold text-[28px] text-white">{total}</p></div>
        <div className="text-right"><p className="text-[13px] text-slate-400">Moy./jour actif</p><p className="font-bold text-[28px] text-white">{avg}</p></div>
      </div>
      <div className="flex items-end gap-1 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1 group">
            <div className="relative w-full">
              {d.count > 0 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-700 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">{d.count}</div>}
              <div className="w-full rounded-t transition-all" style={{ height: `${Math.max((d.count / max) * 160, d.count > 0 ? 6 : 2)}px`, background: color, opacity: d.count > 0 ? 1 : 0.15 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserListModal({ modal, onClose }: { modal: StatModal; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = modal.users.filter(u => {
    const name = u.full_name || u.profiles?.full_name || ''
    const email = u.email || u.profiles?.email || ''
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[16px] text-white">{modal.title} <span className="text-slate-400 font-normal text-[14px]">({modal.users.length})</span></h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="h-9 w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-4 text-[13px] text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="overflow-y-auto space-y-2 flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-6">Aucun utilisateur</p>
          ) : filtered.map((u, i) => {
            const name = u.full_name || u.profiles?.full_name || 'Anonyme'
            const email = u.email || u.profiles?.email || ''
            const plan = u.plan || u.profiles?.plan || 'free'
            return (
              <div key={i} className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-white">{name}</p>
                  <p className="text-[11px] text-slate-400">{email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {modal.columns.map(col => {
                    const val = col.render ? col.render(u) : u[col.key]
                    return val ? <span key={col.key} className="text-[11px] text-slate-400">{val}</span> : null
                  })}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${plan === 'plus' ? 'bg-amber-900/30 text-amber-400' : plan === 'famille' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                    {plan === 'plus'
                      ? <Star className="h-3.5 w-3.5 inline fill-yellow-400 text-yellow-400" />
                      : plan === 'famille'
                        ? <Users className="h-3.5 w-3.5 inline text-purple-400" />
                        : <span className="text-[10px]">FREE</span>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GrowthLineChart({ data }: { data: TimeSeries[] }) {
  if (data.length < 2) return null

  const W = 800, H = 280, PAD = { top: 24, right: 24, bottom: 48, left: 56 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.map(d => d.count), 1)
  const minVal = 0

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * innerW
  const toY = (v: number) => PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH

  // Ligne principale
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.count).toFixed(1)}`).join(' ')

  // Zone de remplissage sous la courbe
  const areaPath = `${linePath} L ${toX(data.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${PAD.left} ${(PAD.top + innerH).toFixed(1)} Z`

  // Graduations Y (5 niveaux)
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 4) * i))

  // Labels X : afficher ~6 dates réparties
  const xStep = Math.max(1, Math.floor(data.length / 6))
  const xLabels = data.filter((_, i) => i % xStep === 0 || i === data.length - 1)

  // Formatage date court
  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400 }}>
        <defs>
          <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="growth-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        {/* Grille horizontale */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={toY(v)} x2={PAD.left + innerW} y2={toY(v)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text x={PAD.left - 10} y={toY(v)} textAnchor="end" dominantBaseline="middle"
              fill="rgba(148,163,184,0.8)" fontSize="11" fontFamily="sans-serif">
              {v}
            </text>
          </g>
        ))}

        {/* Zone remplie */}
        <path d={areaPath} fill="url(#growth-fill)" />

        {/* Ligne principale */}
        <path d={linePath} fill="none" stroke="url(#growth-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points sur chaque donnée */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.count)} r="3"
            fill="#60A5FA" stroke="#1e293b" strokeWidth="1.5" />
        ))}

        {/* Point final mis en valeur */}
        <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].count)} r="5.5"
          fill="#60A5FA" stroke="#fff" strokeWidth="2" />
        <text x={toX(data.length - 1)} y={toY(data[data.length - 1].count) - 12}
          textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
          {data[data.length - 1].count}
        </text>

        {/* Labels X */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d)
          return (
            <text key={i} x={toX(idx)} y={PAD.top + innerH + 20}
              textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="11" fontFamily="sans-serif">
              {fmtDate(d.date)}
            </text>
          )
        })}

        {/* Axe Y */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
    </div>
  )
}

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'stats' | 'users' | 'feedbacks' | 'settings'>('stats')
  const [period, setPeriod] = useState<Period>('7')
  const [stats, setStats] = useState<Stats | null>(null)
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeries[]>>({})
  const [growthSeries, setGrowthSeries] = useState<TimeSeries[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [topUsers, setTopUsers] = useState<User[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [avgScore, setAvgScore] = useState('0')
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<ChartKey>(null)
  const [statModal, setStatModal] = useState<StatModal | null>(null)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [coinAmount, setCoinAmount] = useState('')
  const [newName, setNewName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinFeedback, setPinFeedback] = useState('')
  const [betaEnabled, setBetaEnabled] = useState(true)
  const [betaLoading, setBetaLoading] = useState(false)

  // Listes détaillées
  const [activeUsersToday, setActiveUsersToday] = useState<any[]>([])
  const [usersWithCourses, setUsersWithCourses] = useState<any[]>([])
  const [usersWithQcm, setUsersWithQcm] = useState<any[]>([])
  const [usersWithPerfect, setUsersWithPerfect] = useState<any[]>([])
  const [premiumUsers, setPremiumUsers] = useState<any[]>([])
  const [streakUsers, setStreakUsers] = useState<any[]>([])

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
      setGrowthSeries(data.growthSeries || [])
      setActiveUsersToday(data.activeUsersToday || [])
      setUsersWithCourses(data.usersWithCourses || [])
      setUsersWithQcm(data.usersWithQcm || [])
      setUsersWithPerfect(data.usersWithPerfect || [])
      setPremiumUsers(data.premiumUsers || [])
      setStreakUsers(data.streakUsers || [])
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
      if (data.ok) { setFeedback('OK: Action effectuée'); loadData(); if (action === 'delete_user') setSelectedUser(null) }
      else setFeedback(`Erreur : ${data.error}`)
    } catch { setFeedback('Erreur réseau') }
    setActionLoading(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  async function toggleFeatured(feedbackId: string, currentFeatured: boolean) {
    try {
      const res = await fetch('/api/admin/feedbacks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, featured: !currentFeatured }),
      })
      const data = await res.json()
      if (data.ok) {
        setFeedbacks(prev => prev.map((f: any) => f.id === feedbackId ? { ...f, featured: !currentFeatured } : f))
      } else {
        alert(data.error || 'Erreur')
      }
    } catch { alert('Erreur réseau') }
  }

  function savePin() {
    if (newPin.length < 4) { setPinFeedback('Code trop court (min 4 caractères)'); return }
    localStorage.setItem(STORAGE_KEY, newPin)
    setPinFeedback('OK: Code mis à jour — reconnecte-toi')
    setNewPin('')
    setTimeout(() => { onLogout() }, 2000)
  }

  // Définir les KPI cards avec leurs listes associées
  const kpiCards = [
    {
      key: 'signups' as ChartKey, icon: <Users className="h-5 w-5" />, label: 'Utilisateurs', value: stats?.totalUsers ?? 0, color: '#60A5FA',
      modal: { title: 'Tous les utilisateurs', users, columns: [{ key: 'sky_coins', label: 'Coins', render: (u: any) => `${u.sky_coins} coins` }, { key: 'streak_days', render: (u: any) => `${u.streak_days}j` }] }
    },
    {
      key: null, icon: <Zap className="h-5 w-5" />, label: 'Connectés aujourd\'hui', value: activeUsersToday.length, color: '#34D399',
      modal: { title: 'Connectés aujourd\'hui', users: activeUsersToday, columns: [{ key: 'last_login_at', label: 'Heure', render: (u: any) => u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '' }] }
    },
    {
      key: 'courses' as ChartKey, icon: <BookOpen className="h-5 w-5" />, label: 'Cours créés', value: stats?.totalCourses ?? 0, color: '#FBBF24',
      modal: { title: 'Utilisateurs ayant créé des cours', users: usersWithCourses, columns: [] }
    },
    {
      key: 'qcm' as ChartKey, icon: <Zap className="h-5 w-5" />, label: 'QCM faits', value: stats?.totalQcm ?? 0, color: '#34D399',
      modal: { title: 'Utilisateurs ayant fait des QCM', users: usersWithQcm, columns: [] }
    },
    {
      key: 'avgQcm' as ChartKey, icon: <Trophy className="h-5 w-5" />, label: 'Moy. QCM/élève', value: stats?.avgQcmPerUser ?? '0', color: '#F87171',
      modal: { title: 'Scores parfaits', users: usersWithPerfect, columns: [] }
    },
    {
      key: 'coins' as ChartKey, icon: <Coins className="h-5 w-5" />, label: 'Coins distribués', value: stats?.totalCoinsDistributed ?? 0, color: '#A78BFA',
      modal: { title: 'Top Sky Coins', users: topUsers, columns: [{ key: 'sky_coins', render: (u: any) => `${u.sky_coins} coins` }] }
    },
    {
      key: null, icon: <Trophy className="h-5 w-5" />, label: 'Plans payants', value: premiumUsers.length, color: '#FCD34D',
      modal: { title: 'Utilisateurs Plus / Famille', users: premiumUsers, columns: [{ key: 'plan', render: (u: any) => u.plan }, { key: 'sky_coins', render: (u: any) => `${u.sky_coins} coins` }] }
    },
    {
      key: null, icon: <Flame className="h-5 w-5" />, label: 'Streaks actifs (3j+)', value: streakUsers.length, color: '#FB923C',
      modal: { title: 'Utilisateurs avec streak 3j+', users: streakUsers, columns: [{ key: 'streak_days', render: (u: any) => `${u.streak_days}j` }] }
    },
  ]

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-[#060D1A] text-white">
      {/* Modal liste utilisateurs */}
      {statModal && <UserListModal modal={statModal} onClose={() => setStatModal(null)} />}

      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-yellow-400" />
          <div><h1 className="font-bold text-[18px]">Skynote Admin</h1><p className="text-[12px] text-slate-400">Panel de gestion</p></div>
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
        {([
          ['stats',     'Statistiques', BarChart3],
          ['users',     'Utilisateurs', Users],
          ['feedbacks', 'Feedbacks',    MessageCircle],
          ['settings',  'Paramètres',   Settings],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${tab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {/* Période */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-slate-400">Période :</span>
              {([['7', '7 jours'], ['30', '30 jours'], ['all', 'Tout']] as [Period, string][]).map(([p, l]) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Graphique croissance utilisateurs — toujours visible */}
            {growthSeries.length > 1 && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-[18px] text-white">Utilisateurs inscrits</h2>
                    <p className="text-[13px] text-slate-400">Depuis la création de Skynote</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[36px] text-blue-400 leading-none">
                      {growthSeries[growthSeries.length - 1]?.count ?? 0}
                    </p>
                    <p className="text-[12px] text-slate-500">total</p>
                  </div>
                </div>
                <GrowthLineChart data={growthSeries} />
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* KPI Cards — toutes cliquables */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {kpiCards.map((card) => {
                    const isActive = activeChart === card.key && card.key !== null
                    const series = card.key ? timeSeries[card.key] : null
                    return (
                      <div key={card.label}
                        onClick={() => {
                          if (card.modal) setStatModal(card.modal as StatModal)
                          if (card.key) setActiveChart(activeChart === card.key ? null : card.key)
                        }}
                        className={`rounded-xl border p-4 transition-all cursor-pointer hover:border-slate-600 ${isActive ? 'border-blue-500 bg-slate-800' : 'border-slate-800 bg-slate-900'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div style={{ color: card.color }}>{card.icon}</div>
                          <ChevronUp className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                        </div>
                        <p className="font-bold text-[24px] text-white leading-none">{card.value}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{card.label}</p>
                        {series && series.length > 0 && (
                          <div className="mt-2"><MiniChart data={series} color={card.color} height={28} /></div>
                        )}
                        <p className="text-[10px] text-slate-600 mt-1">Cliquer pour voir la liste →</p>
                      </div>
                    )
                  })}
                </div>

                {/* Graphique agrandi */}
                {activeChart && timeSeries[activeChart] && (
                  <div className="rounded-xl border border-blue-500/30 bg-slate-900 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-[16px] text-white">
                        {CHART_CONFIG[activeChart]?.label} — {period === '7' ? '7 derniers jours' : period === '30' ? '30 derniers jours' : 'Tout'}
                      </h3>
                      <button onClick={() => setActiveChart(null)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    <BigChart data={timeSeries[activeChart]} color={CHART_CONFIG[activeChart]?.color} label={CHART_CONFIG[activeChart]?.label} period={period} />
                  </div>
                )}

                {/* Top utilisateurs */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="flex items-center gap-2 font-semibold text-[15px] mb-4 text-white"><Trophy className="h-4 w-4 text-yellow-400" /> Top 10 — Sky Coins</h3>
                  <div className="space-y-2">
                    {topUsers.map((u, i) => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-slate-500 w-5">{i + 1}</span>
                          <div><p className="text-[14px] font-medium text-white">{u.full_name || 'Anonyme'}</p><p className="text-[11px] text-slate-400">{u.email}</p></div>
                          {(u as any).is_beta_tester && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-400"><FlaskConical className="h-3 w-3" /></span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${u.plan === 'plus' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>{u.plan}</span>
                          <span className="inline-flex items-center gap-1 font-bold text-[14px] text-blue-400">{u.sky_coins} <Coins className="h-3.5 w-3.5" /></span>
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
                  <tr>{['Utilisateur', 'Plan', 'Coins', 'Streak', 'Inscrit', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-400 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div><p className="text-[14px] font-medium text-white">{u.full_name || 'Anonyme'}</p><p className="text-[11px] text-slate-400">{u.email}</p></div>
                          {u.is_beta_tester && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-400 flex-shrink-0"><FlaskConical className="h-3 w-3" /></span>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-2 py-1 rounded-full font-medium ${u.plan === 'plus' ? 'bg-amber-900/30 text-amber-400' : u.plan === 'famille' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>{u.plan}</span></td>
                      <td className="px-4 py-3"><span className="font-bold text-[14px] text-blue-400">{u.sky_coins}</span></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-[14px] text-orange-400"><Flame className="h-3.5 w-3.5" /> {u.streak_days}j</span></td>
                      <td className="px-4 py-3"><span className="text-[13px] text-slate-400">{new Date(u.created_at).toLocaleDateString('fr-FR')}</span></td>
                      <td className="px-4 py-3"><button onClick={() => setSelectedUser(u)} className="rounded-lg bg-blue-600/20 px-3 py-1 text-[12px] font-medium text-blue-400 hover:bg-blue-600/40">Gérer</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div><h3 className="font-bold text-[18px] text-white">{selectedUser.full_name || 'Anonyme'}</h3><p className="text-[13px] text-slate-400">{selectedUser.email}</p></div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white text-xl">×</button>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-800 p-4">
                      <p className="text-[12px] text-slate-400 mb-1">Sky Coins actuels</p>
                      <p className="flex items-center gap-1 font-bold text-[24px] text-blue-400">{selectedUser.sky_coins} <Coins className="h-5 w-5" /></p>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Ajouter / retirer des coins</p>
                      <div className="flex gap-2">
                        <input type="number" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} placeholder="Ex: 50 ou -20"
                          className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none" />
                        <button onClick={() => doAction(selectedUser.id, 'add_coins', coinAmount)} disabled={actionLoading || !coinAmount}
                          className="px-4 rounded-xl bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50">+/-</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Changer le prénom</p>
                      <div className="flex gap-2">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nouveau prénom"
                          className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none" />
                        <button onClick={() => doAction(selectedUser.id, 'set_name', newName)} disabled={actionLoading || !newName.trim()}
                          className="px-4 rounded-xl bg-slate-700 text-[13px] font-semibold text-white hover:bg-slate-600 disabled:opacity-50">OK</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Plan</p>
                      <div className="flex gap-2">
                        {([
                          ['free',    'Gratuit', 'bg-slate-600',  null],
                          ['plus',    'Plus',    'bg-amber-600',  Star],
                          ['famille', 'Famille', 'bg-purple-600', Users],
                        ] as const).map(([p, l, bg, Icon]) => (
                          <button key={p} onClick={() => doAction(selectedUser.id, 'set_plan', p)} disabled={actionLoading}
                            className={`flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-colors ${selectedUser.plan === p || (p === 'plus' && false) ? `${bg} text-white` : 'border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                            {Icon && <Icon className="h-3.5 w-3.5" />}
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {feedback && <p className={`text-[13px] font-medium ${feedback.startsWith('OK:') ? 'text-green-400' : 'text-red-400'}`}>{feedback}</p>}
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
                <p className="font-bold text-[36px]" style={{ color: parseFloat(avgScore) >= 8 ? '#34D399' : '#FBBF24' }}>{avgScore}<span className="text-[16px] text-slate-500">/10</span></p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-[12px] text-slate-400 mb-1">Total feedbacks</p>
                <p className="font-bold text-[36px] text-white">{feedbacks.length}</p>
              </div>
            </div>
            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Aucun feedback</div>
              ) : feedbacks.map((f: any) => {
                const canFeature = f.love && f.score >= 7
                const featuredCount = feedbacks.filter((fb: any) => fb.featured).length
                const isMaxed = featuredCount >= 3 && !f.featured
                return (
                <div key={f.id} className={`rounded-xl border ${f.featured ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900'} p-5`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {canFeature && (
                        <button
                          onClick={() => toggleFeatured(f.id, !!f.featured)}
                          disabled={isMaxed}
                          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                            f.featured
                              ? 'border-emerald-500 bg-emerald-600'
                              : isMaxed
                                ? 'border-slate-700 bg-slate-800 opacity-30 cursor-not-allowed'
                                : 'border-slate-600 bg-transparent hover:border-emerald-500'
                          }`}
                          title={f.featured ? 'Retirer de la landing page' : isMaxed ? 'Maximum 3 avis' : 'Afficher sur la landing page'}
                        >
                          {f.featured && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      )}
                      <div><p className="text-[14px] font-medium text-white">{f.profiles?.full_name || 'Anonyme'}</p><p className="text-[11px] text-slate-400 inline-flex items-center gap-1">{f.profiles?.email}{f.profiles?.is_beta_tester && <><span className="text-blue-400">·</span><FlaskConical className="h-3 w-3 text-blue-400" /></>}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400">Landing page</span>}
                      {f.milestone && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{f.milestone} QCM</span>}
                      <span className="font-bold text-[20px]" style={{ color: f.score >= 8 ? '#34D399' : '#FBBF24' }}>{f.score}/10</span>
                    </div>
                  </div>
                  {f.love && <div className="mb-2"><p className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mb-1"><Check className="h-3 w-3" /> Ce qu&apos;il aime</p><p className="text-[13px] text-slate-300">{f.love}</p></div>}
                  {f.missing && <div><p className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mb-1"><AlertTriangle className="h-3 w-3" /> Ce qui manque</p><p className="text-[13px] text-slate-300">{f.missing}</p></div>}
                  <p className="text-[11px] text-slate-500 mt-2">{new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="max-w-md space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div><h3 className="font-semibold text-[15px] text-white">Mode Bêta Testing</h3><p className="flex items-center gap-1.5 text-[13px] text-slate-400 mt-1"><Circle className={`h-2.5 w-2.5 ${betaEnabled ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} /> {betaEnabled ? 'Activé' : 'Désactivé'}</p></div>
                <button onClick={toggleBeta} disabled={betaLoading} className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-200 ${betaEnabled ? "border-blue-500 bg-blue-600" : "border-slate-600 bg-transparent"}`}>
                  {betaEnabled && <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-semibold text-[15px] text-white mb-1">Changer le code d&apos;accès</h3>
              <div className="flex gap-2 mt-4">
                <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Nouveau code"
                  className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none" />
                <button onClick={savePin} className="px-4 rounded-xl bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-500">Sauvegarder</button>
              </div>
              {pinFeedback && <p className={`mt-2 text-[13px] ${pinFeedback.startsWith('OK:') ? 'text-green-400' : 'text-red-400'}`}>{pinFeedback}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
