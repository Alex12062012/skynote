'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SkyCoinProps {
  size?: number
  className?: string
  /** Si true, tourne une fois au clic */
  clickable?: boolean
}

export function SkyCoin({ size = 40, className, clickable = false }: SkyCoinProps) {
  const [spinning, setSpinning] = useState(false)

  function handleClick() {
    if (!clickable || spinning) return
    setSpinning(true)
    setTimeout(() => setSpinning(false), 600)
  }

  return (
    <>
      <style>{`
        @keyframes coin-spin-once {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        .coin-spinning {
          animation: coin-spin-once 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      <div
        onClick={clickable ? handleClick : undefined}
        className={cn(
          'flex-shrink-0 select-none',
          clickable && 'cursor-pointer',
          className
        )}
        style={{ width: size, height: size, perspective: 400 }}
      >
        <div
          className={spinning ? 'coin-spinning' : ''}
          style={{ width: size, height: size }}
        >
          <Image
            src="/skycoin.png"
            alt="Sky Coin"
            width={size}
            height={size}
            className="object-contain"
            draggable={false}
            priority={size >= 40}
          />
        </div>
      </div>
    </>
  )
}

export function SkynoteLogo({ className, onCoinClick }: { className?: string; onCoinClick?: () => void }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <SkyCoin size={32} clickable={!!onCoinClick} />
      <span className="font-display text-[20px] font-bold tracking-tight text-text-main dark:text-text-dark-main">
        Skynote
      </span>
    </div>
  )
}
