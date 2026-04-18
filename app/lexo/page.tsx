'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

const DEFAULT_PIN = '253912'
const STORAGE_KEY = 'skynote_admin_pin'
const SESSION_KEY = 'skynote_admin_auth'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Vérifier session (valable 2h)
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session) {
      const { expires } = JSON.parse(session)
      if (Date.now() < expires) setAuthenticated(true)
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const storedPin = localStorage.getItem(STORAGE_KEY) || DEFAULT_PIN
    if (pin === storedPin) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expires: Date.now() + 2 * 60 * 60 * 1000 }))
      setAuthenticated(true)
      setError('')
    } else {
      setError('Code incorrect')
      setPin('')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
    setPin('')
  }

  if (!mounted) return null

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060D1A] px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-white" />
            <h1 className="font-display text-[28px] font-bold text-white">Accès Admin</h1>
            <p className="font-body text-[14px] text-slate-400 mt-1">Skynote — Panel de gestion</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Code d'accès"
              maxLength={20}
              autoFocus
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-center font-display text-[20px] tracking-[0.3em] text-white placeholder:text-slate-600 placeholder:tracking-normal focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="text-center font-body text-[13px] text-red-400">{error}</p>}
            <button type="submit"
              className="h-12 w-full rounded-xl bg-blue-600 font-body text-[15px] font-semibold text-white transition hover:bg-blue-500">
              Entrer
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminDashboard onLogout={handleLogout} />
}
