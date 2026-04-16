'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QcmProcessingPollerProps {
  courseId: string
  intervalMs?: number
}

export function QcmProcessingPoller({ courseId, intervalMs = 3000 }: QcmProcessingPollerProps) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, intervalMs)
    return () => clearInterval(interval)
  }, [courseId, intervalMs, router])

  return null
}
