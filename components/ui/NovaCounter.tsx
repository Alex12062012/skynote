'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NovaCoin } from '@/components/ui/NovaCoin'

interface NovaCounterProps {
  initialBalance: number
  userId: string
}

// Au-delà de 100k, on compacte (1,2M au lieu de 1 234 567) pour ne pas faire
// déborder la navbar — un gros solde ne doit jamais casser la mise en page.
function formatNovaBalance(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`
  if (n >= 100_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}K`
  return n.toLocaleString('fr-FR')
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
  const supabaseRef               = useRef(createClient())
  const supabase                  = supabaseRef.current

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
    <div className="lglass-liquid relative flex items-center gap-1.5 rounded-pill px-3 py-1.5">
      <NovaCoin size={18} />
      <span
        className="font-display text-[14px] font-bold tabular-nums text-text-main dark:text-text-dark-main transition-all duration-300"
        style={{ minWidth: 28 }}
        title={`${balance.toLocaleString('fr-FR')} Novas disponibles`}
      >
        {formatNovaBalance(balance)}
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

    </div>
  )
}
