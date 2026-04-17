'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleLike } from '@/lib/supabase/gamification-actions'

interface LikeButtonProps {
  targetUserId: string
  initialLiked: boolean
  initialCount: number
  disabled?: boolean
}

export function LikeButton({ targetUserId, initialLiked, initialCount, disabled }: LikeButtonProps) {
  const [liked, setLiked]   = useState(initialLiked)
  const [count, setCount]   = useState(initialCount)
  const [pending, start]    = useTransition()

  const handleClick = () => {
    if (disabled) return
    // Optimistic
    const prev = liked
    setLiked(!prev)
    setCount((c) => c + (prev ? -1 : 1))
    start(async () => {
      const res = await toggleLike(targetUserId)
      if (res.error || res.liked === null) {
        // rollback
        setLiked(prev)
        setCount((c) => c + (prev ? 1 : -1))
      } else {
        setLiked(res.liked)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || pending}
      className={cn(
        'group inline-flex items-center gap-2 rounded-pill border-2 px-4 py-2 font-display text-[14px] font-bold transition-all',
        liked
          ? 'border-pink-500 bg-pink-500 text-white shadow-btn'
          : 'border-pink-300 bg-white text-pink-600 hover:bg-pink-50 dark:bg-night-surface dark:border-pink-900 dark:text-pink-400',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && !pending && 'hover:scale-[1.03] active:scale-95',
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-transform',
          liked && 'fill-current',
          pending && 'animate-pulse',
        )}
      />
      <span className="tabular-nums">{count}</span>
    </button>
  )
}
