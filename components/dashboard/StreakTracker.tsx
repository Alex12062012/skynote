'use client'

import { useEffect } from 'react'

/**
 * Déclenche silencieusement la mise à jour du streak de connexion.
 * Monté dans le layout dashboard — appel unique par session.
 */
export function StreakTracker({ userId }: { userId: string }) {
  useEffect(() => {
    fetch('/api/update-streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {/* silencieux */})
  }, [userId])

  return null
}
