'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { SkyCoin } from './SkyCoin'
import { createClient } from '@/lib/supabase/client'

interface CoinCounterProps {
  initialCoins: number
  userId: string
}

export function CoinCounter({ initialCoins, userId }: CoinCounterProps) {
  const [coins, setCoins] = useState(initialCoins)
  const [animating, setAnimating] = useState(false)
  const [delta, setDelta] = useState(0)
  const prevCoins = useRef(initialCoins)
  const supabase = createClient()

  const fetchCoins = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('sky_coins')
      .eq('id', userId)
      .single()

    if (data && data.sky_coins !== prevCoins.current) {
      const diff = data.sky_coins - prevCoins.current
      setDelta(diff)
      setAnimating(true)
      setCoins(data.sky_coins)
      prevCoins.current = data.sky_coins
      setTimeout(() => setAnimating(false), 1500)
    }
  }, [userId, supabase])

  // Fetch au montage
  useEffect(() => { fetchCoins() }, [fetchCoins])

  // Polling toutes les 3 secondes
  useEffect(() => {
    const interval = setInterval(fetchCoins, 3000)
    return () => clearInterval(interval)
  }, [fetchCoins])

  // Essayer aussi le Realtime en bonus
  useEffect(() => {
    const channel = supabase
      .channel(`profile-coins-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const newCoins = (payload.new as any).sky_coins
          if (typeof newCoins === 'number' && newCoins !== prevCoins.current) {
            const diff = newCoins - prevCoins.current
            setDelta(diff)
            setAnimating(true)
            setCoins(newCoins)
            prevCoins.current = newCoins
            setTimeout(() => setAnimating(false), 1500)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <div
      data-coin-counter
      className="relative flex items-center gap-1.5 rounded-pill border border-sky-border bg-sky-surface px-3 py-1.5 dark:border-night-border dark:bg-night-surface"
    >
      <SkyCoin size={18} />
      <span
        className="font-display text-[14px] font-bold tabular-nums text-text-main dark:text-text-dark-main transition-all duration-300"
        style={{ minWidth: 24 }}
      >
        {coins.toLocaleString('fr-FR')}
      </span>

      {/* Delta flottant */}
      {animating && delta !== 0 && (
        <span
          key={coins}
          className="pointer-events-none absolute -top-6 left-1/2 font-display text-[13px] font-bold"
          style={{
            color: delta > 0 ? '#059669' : '#DC2626',
            transform: 'translateX(-50%)',
            animation: 'delta-float 1.5s ease-out forwards',
          }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}

      <style>{`
        @keyframes delta-float {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-24px); }
        }
      `}</style>
    </div>
  )
}
