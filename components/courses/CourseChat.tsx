'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, X, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CourseChatProps {
  courseId: string
  courseTitle: string
  isPremium: boolean
}

export function CourseChat({ courseId, courseTitle, isPremium }: CourseChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  async function handleSend() {
    const q = input.trim()
    if (!q || loading) return

    const userMsg: Message = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          question: q,
          history: messages.slice(-6),
        }),
      })
      const data = await res.json()
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Erreur, reessaie.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur reseau, reessaie.' }])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Bouton verrouille si pas premium
  if (!isPremium) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-cloud dark:bg-night-border">
          <Lock className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
        </div>
        <div className="flex-1">
          <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
            Chatbot IA du cours
          </p>
          <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
            Pose tes questions sur le cours. Disponible avec le plan Plus ou Famille.
          </p>
        </div>
        <a href="/pricing" className="flex-shrink-0 rounded-input bg-brand px-3 py-1.5 font-body text-[12px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg">
          Voir les plans
        </a>
      </div>
    )
  }

  return (
    <>
      {/* Bouton ouvrir le chat */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-3 w-full rounded-card border border-brand/20 bg-brand-soft px-5 py-4 text-left transition-all hover:border-brand/40 dark:border-brand-dark/20 dark:bg-brand-dark-soft dark:hover:border-brand-dark/40">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand dark:bg-brand-dark">
            <MessageCircle className="h-5 w-5 text-white dark:text-night-bg" />
          </div>
          <div>
            <p className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">
              Poser une question sur ce cours
            </p>
            <p className="font-body text-[12px] text-brand/60 dark:text-brand-dark/60">
              L'IA repond a tes questions en se basant sur le contenu du cours
            </p>
          </div>
        </button>
      )}

      {/* Chat ouvert */}
      {open && (
        <div className="rounded-card border border-brand/30 bg-sky-surface overflow-hidden dark:border-brand-dark/30 dark:bg-night-surface">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sky-border px-4 py-3 dark:border-night-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-brand dark:text-brand-dark" />
              <span className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
                Chatbot — {courseTitle}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-main dark:hover:text-text-dark-main">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex flex-col gap-3 p-4 max-h-80 overflow-y-auto min-h-[120px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="text-3xl">💬</span>
                <p className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                  Pose une question sur ton cours !
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {['Explique-moi le point principal', 'Donne-moi un exemple', 'Resume ce cours'].map((s) => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
                      className="rounded-pill border border-sky-border px-3 py-1 font-body text-[11px] text-text-secondary hover:border-brand/40 hover:text-brand dark:border-night-border dark:text-text-dark-secondary dark:hover:text-brand-dark transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 font-body text-[14px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg rounded-br-md'
                    : 'bg-sky-cloud text-text-main dark:bg-night-border dark:text-text-dark-main rounded-bl-md'
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-sky-cloud px-4 py-3 dark:bg-night-border rounded-bl-md">
                  {[0,1,2].map(i => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce dark:bg-text-dark-tertiary" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-sky-border p-3 dark:border-night-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question..."
                disabled={loading}
                className="flex-1 h-10 rounded-input border border-sky-border bg-sky-bg px-3 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none disabled:opacity-50 dark:border-night-border dark:bg-night-bg dark:text-text-dark-main dark:focus:border-brand-dark"
              />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-input bg-brand text-white hover:bg-brand-hover disabled:opacity-40 dark:bg-brand-dark dark:text-night-bg transition-all">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
