'use client'

import Link from 'next/link'
import { Brain, ChevronRight } from 'lucide-react'

interface ReviewBannerProps {
  dueCount: number
}

export function ReviewBanner({ dueCount }: ReviewBannerProps) {
  if (dueCount === 0) return null

  const urgency =
    dueCount > 10
      ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15'
      : dueCount >= 5
      ? 'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/15'
      : 'border-brand/30 bg-brand/10 text-brand-dark hover:bg-brand/15'

  return (
    <Link
      href="/review"
      className={`flex w-full items-center gap-3 rounded-card border px-4 py-3 transition ${urgency}`}
    >
      <Brain className="h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium">
        <span className="font-bold">{dueCount}</span> carte{dueCount > 1 ? 's' : ''} à réviser aujourd'hui
      </p>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
    </Link>
  )
}
