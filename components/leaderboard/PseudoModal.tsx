'use client'

import { useState } from 'react'
import { X, Trophy } from 'lucide-react'

export function PseudoModal({ userId }: { userId: string }) {
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [success, setSuccess] = useState(false)

  if (dismissed || success) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pseudo.trim() || pseudo.trim().length < 2) {
      setError('Le pseudo doit faire au moins 2 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/set-pseudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo: pseudo.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur')
      } else {
        setSuccess(true)
        window.location.reload()
      }
    } catch {
      setError('Erreur reseau')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-card-login border border-sky-border bg-sky-surface p-6 shadow-2xl dark:border-night-border dark:bg-night-surface animate-slide-in">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary/40 transition-colors hover:text-text-tertiary dark:text-text-dark-tertiary/30 dark:hover:text-text-dark-tertiary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
            <Trophy className="h-5 w-5 text-brand dark:text-brand-dark" />
          </div>
          <div>
            <h3 className="font-display text-[17px] font-bold text-text-main dark:text-text-dark-main">
              Choisis ton pseudo
            </h3>
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              Pour le classement
            </p>
          </div>
        </div>

        <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mb-4 leading-relaxed">
          Les autres joueurs verront ton pseudo dans le classement. Sans pseudo, tu apparais comme <strong>"user_X"</strong>.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            placeholder="Ton pseudo (max 20 car.)"
            className="h-11 w-full rounded-input border border-sky-border bg-sky-bg px-4 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-bg dark:text-text-dark-main dark:focus:border-brand-dark"
            autoFocus
          />
          {error && (
            <p className="font-body text-[12px] text-error">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || pseudo.trim().length === 0}
            className="h-11 w-full rounded-input bg-brand font-body text-[14px] font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-50 dark:bg-brand-dark dark:text-night-bg dark:hover:bg-brand-dark-hover"
          >            {loading ? 'Validation...' : 'Valider mon pseudo'}
          </button>
        </form>
      </div>
    </div>
  )
}
