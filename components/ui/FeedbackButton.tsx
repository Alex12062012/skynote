'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function FeedbackButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [love, setLove] = useState('')
  const [missing, setMissing] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!score) return
    startTransition(async () => {
      await supabase.from('feedbacks').insert({
        user_id: userId,
        love: love.trim() || null,
        missing: missing.trim() || null,
        score,
      })
      setSent(true)
      setTimeout(() => { setOpen(false); setSent(false); setLove(''); setMissing(''); setScore(null) }, 2000)
    })
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-pill bg-brand px-4 py-2.5 font-body text-[13px] font-semibold text-white shadow-btn transition-all hover:bg-brand-hover hover:scale-105 dark:bg-brand-dark dark:text-night-bg dark:hover:bg-brand-dark-hover"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-card-login bg-sky-surface p-6 shadow-2xl dark:bg-night-surface animate-slide-in">

            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-h4 text-text-main dark:text-text-dark-main">
                Ton avis compte 🙏
              </h3>
              <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-main dark:hover:text-text-dark-main">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="text-4xl animate-pop-in">🎉</span>
                <p className="font-display text-h4 text-success dark:text-success-dark">Merci pour ton retour !</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Note */}
                <div>
                  <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main mb-2">
                    Note Skynote sur 10 *
                  </p>
                  <div className="flex gap-1 w-full">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <div key={n} className="relative flex-1">
                        {n === 10 && (
                          <span className="pointer-events-none absolute -top-2 -right-1 text-[11px]" style={{ transform: 'rotate(25deg)', display: 'inline-block', zIndex: 10 }}>
                            👑
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setScore(n)}
                          className={`relative w-full h-9 rounded-input font-body text-[13px] font-bold transition-all ${
                            n === 10
                              ? score === n
                                ? 'bg-amber-400 text-white shadow-md'
                                : 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/50'
                              : score === n
                                ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
                                : 'bg-sky-cloud text-text-secondary hover:bg-brand-soft dark:bg-night-border dark:text-text-dark-secondary'
                          }`}
                        >
                          {n}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ce que tu aimes */}
                <div>
                  <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
                    Qu'est-ce que tu aimes ?
                  </label>
                  <textarea
                    value={love}
                    onChange={(e) => setLove(e.target.value)}
                    placeholder="Les fiches générées, le design..."
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-input border border-sky-border bg-sky-surface px-3 py-2.5 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark"
                  />
                </div>

                {/* Ce qui manque */}
                <div>
                  <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
                    Qu'est-ce qui manque ?
                  </label>
                  <textarea
                    value={missing}
                    onChange={(e) => setMissing(e.target.value)}
                    placeholder="Une fonctionnalité, un bug..."
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-input border border-sky-border bg-sky-surface px-3 py-2.5 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!score || isPending}
                  className="flex items-center justify-center gap-2 h-11 rounded-input bg-brand font-body text-[14px] font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-50 dark:bg-brand-dark dark:text-night-bg"
                >
                  <Send className="h-4 w-4" />
                  {isPending ? 'Envoi...' : 'Envoyer'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
