'use client'

import { useEffect, useState, useRef } from 'react'
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

  // Récupérer le vrai solde au montage (évite le solde périmé du SSR)
  useEffect(() => {
    supabase
      .from('profiles')
      .select('sky_coins')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data && data.sky_coins !== prevCoins.current) {
          setCoins(data.sky_coins)
          prevCoins.current = data.sky_coins
        }
      })
  }, [userId])

  // Écoute realtime — mise à jour en direct quand les coins changent
  useEffect(() => {
    const channel = supabase
      .channel(`coins-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const newCoins = (payload.new as { sky_coins: number }).sky_coins
          if (newCoins !== prevCoins.current) {
            const diff = newCoins - prevCoins.current
            setDelta(diff)
            setAnimating(true)
            setCoins(newCoins)
            prevCoins.current = newCoins
            setTimeout(() => setAnimating(false), 1200)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <div className="relative flex items-center gap-1.5 rounded-pill border border-sky-border bg-sky-surface px-3 py-1.5 dark:border-night-border dark:bg-night-surface">
      <SkyCoin size={18} />
      <span
        className="font-display text-[14px] font-bold tabular-nums text-text-main dark:text-text-dark-main transition-all duration-300"
        style={{ minWidth: 24 }}
      >
        {coins.toLocaleString('fr-FR')}
      </span>

      {/* Delta +X qui apparaît brièvement */}
      {animating && delta !== 0 && (
        <span
          className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 font-display text-[13px] font-bold"
          style={{
            color: delta > 0 ? '#059669' : '#DC2626',
            animation: 'delta-float 1.2s ease-out forwards',
          }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}

      <style>{`
        @keyframes delta-float {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
      `}</style>
    </div>
  )
}
