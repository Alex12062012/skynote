'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function RetryGenerationButton({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRetry() {
    setLoading(true)
    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
    } finally {
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" loading={loading} onClick={handleRetry}>
      Réessayer
    </Button>
  )
}
