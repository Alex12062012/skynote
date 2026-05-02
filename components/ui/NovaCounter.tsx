'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NovaCounterProps {
  initialBalance: number
  userId: string
}

/**
 * Affiche le solde de Novas ✦ de l'utilisateur en temps réel.
 * Se synchronise via polling + Realtime Supabase sur la table wallets.
 */
export function NovaCounter({ initialBalance, userId }: NovaCounterProps) {
  const [balance, setBalance]     = useState(initialBalance)
  const [animating, setAnimating] = useState(false)
  const [delta, setDelta]         = useState(0)
  const prevBalance               = useRef(initialBalance)
  const supabase                  = createClient()

  const fetchBalance = useCallback(async () => {
    const { data } = await supabase
      .from('wallets')
      .select('novas_balance')
      .eq('user_id', userId)
      .single()

    if (data && data.novas_balance !== prevBalance.current) {
      const diff = data.novas_balance - prevBalance.current
      setDelta(diff)
      setAnimating(true)
      setBalance(data.novas_balance)
      prevBalance.current = data.novas_balance
      setTimeout(() => setAnimating(false), 1500)
    }
  }, [userId, supabase])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  // Polling toutes les 4 secondes
  useEffect(() => {
    const interval = setInterval(fetchBalance, 4000)
    return () => clearInterval(interval)
  }, [fetchBalance])

  // Realtime en bonus
  useEffect(() => {
    const channel = supabase
      .channel(`wallet-novas-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newBalance = (payload.new as any).novas_balance
          if (typeof newBalance === 'number' && newBalance !== prevBalance.current) {
            const diff = newBalance - prevBalance.current
            setDelta(diff)
            setAnimating(true)
            setBalance(newBalance)
            prevBalance.current = newBalance
            setTimeout(() => setAnimating(false), 1500)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  return (
    <div className="relative flex items-center gap-1.5 rounded-pill border border-sky-border bg-sky-surface px-3 py-1.5 dark:border-night-border dark:bg-night-surface">
      {/* Icône Nova — pièce bleue */}
      <img
        src="/nova-coin.png"
        alt="Nova"
        width={18}
        height={18}
        className="select-none object-contain"
        onError={(e) => {
          // Fallback texte si l'image n'est pas encore uploadée
          const el = e.currentTarget
          el.style.display = 'none'
          const span = document.createElement('span')
          span.textContent = '✦'
          span.style.color = '#6366f1'
          span.style.fontSize = '15px'
          span.style.lineHeight = '1'
          el.parentNode?.insertBefore(span, el)
        }}
        aria-hidden="true"
      />
      <span
        className="font-display text-[14px] font-bold tabular-nums text-text-main dark:text-text-dark-main transition-all duration-300"
        style={{ minWidth: 28 }}
        title={`${balance.toLocaleString('fr-FR')} Novas disponibles`}
      >
        {balance.toLocaleString('fr-FR')}
      </span>

      {/* Delta flottant */}
      {animating && delta !== 0 && (
        <span
          key={balance}
          className="pointer-events-none absolute -top-6 left-1/2 font-display text-[13px] font-bold"
          style={{
            color: delta > 0 ? '#059669' : '#DC2626',
            transform: 'translateX(-50%)',
            animation: 'nova-delta-float 1.5s ease-out forwards',
          }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}

      <style>{`
        @keyframes nova-delta-float {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-24px); }
        }
      `}</style>
    </div>
  )
}
