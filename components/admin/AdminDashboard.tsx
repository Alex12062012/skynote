'use client'

import { useState, useEffect } from 'react'
import { Users, BookOpen, Zap, Trophy, DollarSign, Coins, Settings, LogOut, Search, ChevronUp, ChevronDown, Trash2, Star, RefreshCw } from 'lucide-react'

const STORAGE_KEY = 'skynote_admin_pin'

interface Stats {
  totalUsers: number; totalCourses: number; totalQcm: number; perfectQcm: number
  totalFlashcards: number; estimatedApiCost: string; totalCoinsDistributed: number
  avgCoursesPerUser: string
}
interface User {
  id: string; email: string; full_name: string | null; sky_coins: number
  plan: string; streak_days: number; created_at: string; last_login_at: string | null
}
interface DailySignup { date: string; count: number }

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'stats' | 'users' | 'settings'>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [topUsers, setTopUsers] = useState<User[]>([])
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [coinAmount, setCoinAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinFeedback, setPinFeedback] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data.stats)
      setUsers(data.recentUsers)
      setTopUsers(data.topUsers)
      setDailySignups(data.dailySignups)
    } catch {}
    setLoading(false)
  }

  async function doAction(userId: string, action: string, value?: any) {
    setActionLoading(true)
    setFeedback('')
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value }),
      })
      const data = await res.json()
      if (data.ok) {
        setFeedback('✓ Action effectuée')
        loadData()
        if (action === 'delete_user') setSelectedUser(null)
        if (data.newCoins !== undefined && selectedUser) {
          setSelectedUser({ ...selectedUser, sky_coins: data.newCoins })
        }
      } else setFeedback(`Erreur : ${data.error}`)
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
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name?.toLowerCase().includes(search.toLowerCase()))
  )

  const maxSignups = Math.max(...dailySignups.map(d => d.count), 1)

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
        {[['stats', '📊 Statistiques'], ['users', '👥 Utilisateurs'], ['settings', '⚙️ Paramètres']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${tab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { icon: <Users className="h-5 w-5" />, label: 'Utilisateurs', value: stats?.totalUsers ?? 0, color: 'text-blue-400' },
                    { icon: <BookOpen className="h-5 w-5" />, label: 'Cours créés', value: stats?.totalCourses ?? 0, color: 'text-emerald-400' },
                    { icon: <Zap className="h-5 w-5" />, label: 'QCM faits', value: stats?.totalQcm ?? 0, color: 'text-amber-400' },
                    { icon: <Trophy className="h-5 w-5" />, label: 'Scores parfaits', value: stats?.perfectQcm ?? 0, color: 'text-purple-400' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                      <div className={`mb-3 ${s.color}`}>{s.icon}</div>
                      <p className="font-bold text-[28px] text-white">{s.value}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Métriques avancées */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-[13px]">Coût API Anthropic estimé</span>
                    </div>
                    <p className="font-bold text-[28px] text-green-400">${stats?.estimatedApiCost}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Basé sur {stats?.totalCourses} cours générés</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                      <span className="text-[16px]">🪙</span>
                      <span className="text-[13px]">Sky Coins distribués</span>
                    </div>
                    <p className="font-bold text-[28px] text-blue-400">{stats?.totalCoinsDistributed}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Total toutes transactions</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-[13px]">Cours / utilisateur</span>
                    </div>
                    <p className="font-bold text-[28px] text-amber-400">{stats?.avgCoursesPerUser}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{stats?.totalFlashcards} fiches générées au total</p>
                  </div>
                </div>

                {/* Graphique inscriptions */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <h3 className="font-semibold text-[15px] mb-6 text-white">Inscriptions — 7 derniers jours</h3>
                  <div className="flex items-end gap-3 h-32">
                    {dailySignups.map((d) => (
                      <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-400">{d.count || ''}</span>
                        <div className="w-full rounded-t-md bg-blue-600 transition-all"
                          style={{ height: `${(d.count / maxSignups) * 100}%`, minHeight: d.count > 0 ? 8 : 2, opacity: d.count > 0 ? 1 : 0.2 }} />
                        <span className="text-[10px] text-slate-500">
                          {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

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
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${u.plan === 'premium' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                            {u.plan}
                          </span>
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
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par email ou prénom..."
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-4 text-[14px] text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <span className="text-[13px] text-slate-400">{filteredUsers.length} utilisateurs</span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    {['Utilisateur', 'Plan', 'Coins', 'Streak', 'Inscrit le', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[12px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[14px] font-medium text-white">{u.full_name || 'Anonyme'}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${u.plan === 'premium' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-[14px] text-blue-400">{u.sky_coins}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[14px] text-orange-400">🔥 {u.streak_days}j</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] text-slate-400">
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedUser(u)}
                          className="rounded-lg bg-blue-600/20 px-3 py-1 text-[12px] font-medium text-blue-400 hover:bg-blue-600/40 transition-colors">
                          Gérer
                        </button>
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
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white text-xl">×</button>
                  </div>

                  <div className="space-y-4">
                    {/* Coins actuels */}
                    <div className="rounded-xl bg-slate-800 p-4">
                      <p className="text-[12px] text-slate-400 mb-1">Sky Coins actuels</p>
                      <p className="font-bold text-[24px] text-blue-400">{selectedUser.sky_coins} 🪙</p>
                    </div>

                    {/* Ajouter/retirer des coins */}
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Ajouter / retirer des coins</p>
                      <div className="flex gap-2">
                        <input type="number" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)}
                          placeholder="Ex: 50 ou -20"
                          className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none" />
                        <button onClick={() => doAction(selectedUser.id, 'add_coins', coinAmount)} disabled={actionLoading || !coinAmount}
                          className="px-4 rounded-xl bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                          Appliquer
                        </button>
                      </div>
                    </div>

                    {/* Définir les coins exactement */}
                    <div>
                      <p className="text-[13px] font-medium text-white mb-2">Définir exactement</p>
                      <div className="flex gap-2">
                        <input type="number" placeholder="Ex: 100"
                          className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none"
                          onChange={(e) => setCoinAmount(e.target.value)} />
                        <button onClick={() => doAction(selectedUser.id, 'set_coins', coinAmount)} disabled={actionLoading || !coinAmount}
                          className="px-4 rounded-xl bg-slate-700 text-[13px] font-semibold text-white hover:bg-slate-600 disabled:opacity-50">
                          Définir
                        </button>
                      </div>
                    </div>

                    {/* Plan */}
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

                    {/* Feedback */}
                    {feedback && (
                      <p className={`text-[13px] font-medium ${feedback.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                        {feedback}
                      </p>
                    )}

                    {/* Supprimer */}
                    <button
                      onClick={() => { if (confirm(`Supprimer ${selectedUser.email} ?`)) doAction(selectedUser.id, 'delete_user') }}
                      disabled={actionLoading}
                      className="w-full h-10 rounded-xl border border-red-900/50 bg-red-950/20 text-[13px] font-semibold text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" /> Supprimer ce compte
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="max-w-md space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-semibold text-[15px] text-white mb-1">Changer le code d'accès</h3>
              <p className="text-[13px] text-slate-400 mb-4">Minimum 4 caractères. Tu seras déconnecté après le changement.</p>
              <div className="flex gap-2">
                <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Nouveau code"
                  className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-[14px] text-white focus:border-blue-500 focus:outline-none" />
                <button onClick={savePin}
                  className="px-4 rounded-xl bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-500">
                  Sauvegarder
                </button>
              </div>
              {pinFeedback && (
                <p className={`mt-2 text-[13px] ${pinFeedback.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                  {pinFeedback}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-semibold text-[15px] text-white mb-3">Infos du panel</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">URL d'accès</span>
                  <span className="text-white font-mono">/lexo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session</span>
                  <span className="text-white">2 heures</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Code par défaut</span>
                  <span className="text-white font-mono">253912</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
