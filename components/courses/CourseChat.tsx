'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, X, Lock, Brain, AlertTriangle, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type MessageType = 'text' | 'quiz_suggestion' | 'error_insight' | 'premium_prompt'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: MessageType
  timestamp?: string
}

interface CourseChatProps {
  courseId: string
  courseTitle: string
  isPremium: boolean
}

const SUGGESTIONS = [
  'Explique-moi le point principal',
  'Donne-moi un exemple',
  'Résume ce cours',
]

// ============================================================
// Bulle assistant selon type
// ============================================================

function AssistantBubble({ message }: { message: Message }) {
  const type = message.type ?? 'text'

  if (type === 'quiz_suggestion') {
    return (
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-violet-500/30 bg-violet-500/10 px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-400">Quiz</span>
        </div>
        <p className="font-body text-[14px] leading-relaxed text-main dark:text-dark-main whitespace-pre-wrap">{message.content}</p>
      </div>
    )
  }

  if (type === 'error_insight') {
    return (
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-orange-500/30 bg-orange-500/10 px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-400">Point d'attention</span>
        </div>
        <p className="font-body text-[14px] leading-relaxed text-main dark:text-dark-main whitespace-pre-wrap">{message.content}</p>
      </div>
    )
  }

  if (type === 'premium_prompt') {
    return (
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-brand/30 bg-brand/5 px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-brand" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">Premium</span>
        </div>
        <p className="font-body text-[13px] leading-relaxed text-text-secondary dark:text-dark-secondary mb-2">{message.content}</p>
        <Link
          href="/pricing"
          className="inline-flex h-7 items-center rounded-full bg-brand px-3 text-[12px] font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Voir les plans
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-sky-cloud px-4 py-2.5 dark:bg-night-border">
      <p className="font-body text-[14px] leading-relaxed text-main dark:text-dark-main whitespace-pre-wrap">{message.content}</p>
    </div>
  )
}

// ============================================================
// Composant principal
// ============================================================

export function CourseChat({ courseId, courseTitle, isPremium }: CourseChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
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

  // Charger historique persisté à l'ouverture (une seule fois)
  useEffect(() => {
    if (!open || historyLoaded || messages.length > 0) return
    setHistoryLoaded(true)
    fetch(`/api/chat?courseId=${courseId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages)
        }
      })
      .catch(() => {})
  }, [open, courseId, historyLoaded, messages.length])

  async function handleSend() {
    const q = input.trim()
    if (!q || loading) return

    const userMsg: Message = { role: 'user', content: q, type: 'text', timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, question: q, history: messages.slice(-6) }),
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || data.error || 'Une erreur est survenue, réessaie.',
          type: (data.type as MessageType) ?? 'text',
          timestamp: new Date().toISOString(),
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Erreur réseau, réessaie.', type: 'text' },
      ])
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!isPremium) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-cloud dark:bg-night-border">
          <Lock className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[14px] font-semibold text-main dark:text-dark-main">Chatbot IA du cours</p>
          <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
            Pose tes questions sur le cours. Disponible avec le plan Plus ou Famille.
          </p>
        </div>
        <a href="/pricing" className="flex-shrink-0 rounded-input bg-brand px-3 py-1.5 font-body text-[12px] font-semibold text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg transition-colors">
          Voir les plans
        </a>
      </div>
    )
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 w-full rounded-card border border-brand/20 bg-brand-soft px-5 py-4 text-left transition-all hover:border-brand/40 dark:border-brand-dark/20 dark:bg-brand-dark-soft dark:hover:border-brand-dark/40"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand dark:bg-brand-dark">
            <MessageCircle className="h-5 w-5 text-white dark:text-night-bg" />
          </div>
          <div>
            <p className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">Poser une question sur ce cours</p>
            <p className="font-body text-[12px] text-brand/60 dark:text-brand-dark/60">L'IA répond en se basant sur le contenu du cours</p>
          </div>
        </button>
      )}

      {open && (
        <div className="rounded-card border border-brand/30 bg-sky-surface overflow-hidden dark:border-brand-dark/30 dark:bg-night-surface">
          <div className="flex items-center justify-between border-b border-sky-border px-4 py-3 dark:border-night-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-brand dark:text-brand-dark" />
              <span className="font-body text-[14px] font-semibold text-main dark:text-dark-main truncate">Chatbot — {courseTitle}</span>
            </div>
            <button onClick={() => setOpen(false)} className="flex-shrink-0 text-text-tertiary hover:text-main dark:hover:text-dark-main transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-col gap-3 p-4 max-h-80 overflow-y-auto min-h-[120px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <MessageCircle className="h-8 w-8 text-text-tertiary dark:text-text-dark-tertiary" />
                <p className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">Pose une question sur ton cours !</p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus() }}
                      className="rounded-pill border border-sky-border px-3 py-1 font-body text-[11px] text-text-secondary hover:border-brand/40 hover:text-brand dark:border-night-border dark:text-text-dark-secondary dark:hover:text-brand-dark transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 dark:bg-brand-dark">
                    <p className="font-body text-[14px] leading-relaxed text-white dark:text-night-bg whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <AssistantBubble message={msg} />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-sky-cloud px-4 py-3 dark:bg-night-border">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce dark:bg-text-dark-tertiary" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-sky-border p-3 dark:border-night-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question..."
                disabled={loading}
                className="flex-1 h-10 rounded-input border border-sky-border bg-sky-bg px-3 font-body text-[14px] text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none disabled:opacity-50 dark:border-night-border dark:bg-night-bg dark:text-dark-main dark:focus:border-brand-dark"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-input bg-brand text-white hover:bg-brand-hover disabled:opacity-40 dark:bg-brand-dark dark:text-night-bg transition-all active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
