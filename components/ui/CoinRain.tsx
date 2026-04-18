'use client'

import { useMemo } from 'react'
import { SkyCoin } from './SkyCoin'

interface CoinRainProps {
  /** Afficher la pluie de coins (boost x2 actif) */
  active: boolean
}

/**
 * Pluie ambiante de Sky Coins – apparaît quand le boost x2 est actif.
 * Les coins tombent en fondu via @keyframes coin-fall (globals.css).
 */
export function CoinRain({ active }: CoinRainProps) {
  // Générer les coins une seule fois pour éviter les re-renders
  const coins = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${5 + Math.floor(((i * 7 + 13) * 97) % 90)}%`,
      delay: `${((i * 0.37 + 0.1) % 5).toFixed(2)}s`,
      duration: `${(3.5 + ((i * 0.53) % 2.5)).toFixed(2)}s`,
      size: 12 + ((i * 3) % 10),
      opacity: 0.55 + ((i * 0.07) % 0.35),
    }))
  }, [])

  if (!active) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {coins.map(coin => (
        <div
          key={coin.id}
          style={{
            position: 'absolute',
            top: '-48px',
            left: coin.left,
            opacity: coin.opacity,
            animation: `coin-fall ${coin.duration} ${coin.delay} ease-in infinite`,
          }}
        >
          <SkyCoin size={coin.size} />
        </div>
      ))}
    </div>
  )
}
