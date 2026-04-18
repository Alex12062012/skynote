'use client'

import { useState, useTransition } from 'react'
import { Send, Rocket, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ForcedFeedbackProps {
  userId: string
  milestone: 5 | 25
  onDone: () => void
}

export function ForcedFeedback({ userId, milestone, onDone }: ForcedFeedbackProps) {
  const [love, setLove] = useState('')
  const [missing, setMissing] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!score) { setError('Merci de donner une note !'); return }

    startTransition(async () => {
      await supabase.from('feedbacks').insert({
        user_id: userId,
        love: love.trim() || null,
        missing: missing.trim() || null,
        score,
        milestone,
      })

      const field = milestone === 5 ? 'feedback_shown_5' : 'feedback_shown_25'
      await supabase.from('profiles').update({ [field]: true }).eq('id', userId)

      setSent(true)
      setTimeout(() => onDone(), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,26,0.85)', backdropFilter: 'blur(8px)' }}>

      <div className="w-full max-w-md rounded-card-login bg-sky-surface p-6 shadow-2xl dark:bg-night-surface animate-pop-in">

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <h3 className="font-display text-h3 text-success dark:text-success-dark">Merci pour ton retour !</h3>
            <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              Ton avis nous aide enormement a ameliorer Skynote.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-5 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
                  {milestone === 5
                    ? <Rocket className="h-8 w-8 text-brand dark:text-brand-dark" />
                    : <Star className="h-8 w-8 text-amber-500" />}
                </div>
              </div>
              <h3 className="font-display text-h3 text-text-main dark:text-text-dark-main">
                {milestone === 5 ? 'Tu as fait 5 QCM !' : 'Tu as fait 25 QCM !'}
              </h3>
              <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
                Aide-nous a ameliorer Skynote avec ton avis — ca prend 30 secondes !
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Note */}
              <div>
                <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main mb-2">
                  Note Skynote sur 10 <span className="text-error">*</span>
                </p>
                <div className="flex gap-1 w-full">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <div key={n} className="relative flex-1">
                      <button type="button" onClick={() => { setScore(n); setError('') }}
                        className={`w-full h-9 rounded-input font-body text-[13px] font-bold transition-all ${
                          n === 10
                            ? score === n ? 'bg-amber-400 text-white shadow-md' : 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                            : score === n ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg' : 'bg-sky-cloud text-text-secondary hover:bg-brand-soft dark:bg-night-border dark:text-text-dark-secondary'
                        }`}>
                        {n}
                      </button>
                    </div>
                  ))}
                </div>
                {error && <p className="mt-1 font-body text-[12px] text-error">{error}</p>}
              </div>

              {/* Ce que tu aimes */}
              <div>
                <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
                  {"Qu'est-ce que tu aimes dans Skynote ?"}
                </label>
                <textarea value={love} onChange={(e) => setLove(e.target.value)}
                  placeholder="Les fiches generees, le design, les QCM..."
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-input border border-sky-border bg-sky-surface px-3 py-2.5 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark" />
              </div>

              {/* Ce qui manque */}
              <div>
                <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
                  {"Qu'est-ce qui manque ou pourrait etre ameliore ?"}
                </label>
                <textarea value={missing} onChange={(e) => setMissing(e.target.value)}
                  placeholder="Une fonctionnalite, un bug, une suggestion..."
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-input border border-sky-border bg-sky-surface px-3 py-2.5 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark" />
              </div>

              <button type="submit" disabled={isPending}
                className="flex items-center justify-center gap-2 h-11 rounded-input bg-brand font-body text-[14px] font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-50 dark:bg-brand-dark dark:text-night-bg">
                <Send className="h-4 w-4" />
                {isPending ? 'Envoi...' : 'Envoyer mon avis'}
              </button>

              <p className="text-center font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                Ton feedback est anonyme et nous aide vraiment.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
