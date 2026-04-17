'use client'

import { useEffect, useRef } from 'react'

interface GenerationTriggerProps {
  courseId: string
}

/**
 * Ce composant invisible déclenche la génération IA
 * dès que la page du cours s'affiche pour la première fois.
 * Il n'affiche rien — c'est juste un side-effect.
 */
export function GenerationTrigger({ courseId }: GenerationTriggerProps) {
  const triggered = useRef(false)

  useEffect(() => {
    if (triggered.current) return
    triggered.current = true

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch((err) => {
      console.error('[GenerationTrigger] Failed to start generation:', err)
    })
  }, [courseId])

  return null
}
