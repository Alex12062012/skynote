'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Rocket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function FamilleLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [familyCode, setFamilyCode] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [childName, setChildName] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: group } = await (supabase as any)
      .from('famille_groups')
      .select('id')
      .eq('family_code', familyCode.toUpperCase().trim())
      .single()

    if (!group) {
      setError('Code famille introuvable. Vérifie le code donné par tes parents.')
      setLoading(false)
      return
    }

    const { data: child } = await (supabase as any)
      .from('child_accounts')
      .select('*')
      .eq('famille_id', group.id)
      .eq('access_code', accessCode.trim())
      .single()

    if (!child) {
      setError('Code personnel incorrect.')
      setLoading(false)
      return
    }

    localStorage.setItem('child_session', JSON.stringify({
      id: child.id,
      pseudo: child.pseudo,
      famille_id: child.famille_id,
      parent_id: child.parent_id,
      sky_coins: child.sky_coins,
      streak_days: child.streak_days,
    }))

    setChildName(child.pseudo)
    setTimeout(() => router.push('/child-dashboard'), 1500)
  }

  if (childName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-bg dark:bg-night-bg px-4">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/30 font-display text-[40px] font-bold text-purple-600 dark:text-purple-400 shadow-lg">
            {childName[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-h2 text-text-main dark:text-text-dark-main">
              Bonjour {childName} !
            </h2>
            <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              Connexion en cours...
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-bg dark:bg-night-bg px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-3 mb-2">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <span className="font-display text-[22px] font-bold text-text-main dark:text-text-dark-main">
              Skynote Famille
            </span>
          </Link>
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Connecte-toi avec le code donné par tes parents
          </p>
        </div>

        {/* Card */}
        <div className="rounded-card-login border border-purple-200 bg-sky-surface p-6 shadow-card dark:border-purple-900/30 dark:bg-night-surface">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Code famille */}
            <div>
              <label className="font-body text-[13px] font-semibold text-text-main dark:text-text-dark-main mb-2 block">
                Code famille
              </label>
              <input
                type="text"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                placeholder="FAM-XXXX"
                maxLength={8}
                required
                autoFocus
                className="h-12 w-full rounded-input border border-sky-border bg-sky-bg px-4 font-mono text-[18px] font-bold text-text-main placeholder:text-text-tertiary placeholder:font-normal focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 dark:border-night-border dark:bg-night-bg dark:text-text-dark-main uppercase tracking-widest transition-all"
              />
              <p className="mt-1.5 font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                Commence par FAM- (donné par tes parents)
              </p>
            </div>

            {/* Code personnel */}
            <div>
              <label className="font-body text-[13px] font-semibold text-text-main dark:text-text-dark-main mb-2 block">
                Ton code personnel
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                required
                className="h-12 w-full rounded-input border border-sky-border bg-sky-bg px-4 font-mono text-[28px] font-bold text-text-main placeholder:text-text-tertiary focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 dark:border-night-border dark:bg-night-bg dark:text-text-dark-main tracking-[12px] text-center transition-all"
              />
              <p className="mt-1.5 font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                4 chiffres fournis par tes parents
              </p>
            </div>

            {error && (
              <div className="rounded-input border border-error/20 bg-error/5 px-4 py-3">
                <p className="font-body text-[13px] text-error">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || familyCode.length < 4 || accessCode.length < 4}
              className="flex h-12 items-center justify-center gap-2 rounded-input bg-gradient-to-r from-purple-500 to-purple-600 font-body text-[15px] font-semibold text-white shadow-md hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" /> Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lien compte normal */}
        <p className="mt-5 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          Tu as un compte normal ?{' '}
          <Link href="/login" className="font-medium text-brand hover:underline dark:text-brand-dark">
            Connexion normale →
          </Link>
        </p>

      </div>
    </div>
  )
}
