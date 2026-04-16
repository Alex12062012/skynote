'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap } from 'lucide-react'
import Link from 'next/link'

interface QcmGeneratorProps {
  courseId: string
  flashcards: { id: string; title: string }[]
}

export function QcmGenerator({ courseId, flashcards }: QcmGeneratorProps) {
  const router = useRouter()
  const triggered = useRef(false)
  const [error, setError] = useState(false)
  const supabase = createClient()

  // Declencher la generation batch une seule fois au montage
  useEffect(() => {
    if (triggered.current) return
    triggered.current = true

    fetch('/api/generate-qcm/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
      keepalive: true,
    }).catch(() => setError(true))
  }, [courseId])

  // Ecouter la mise a jour qcm_status via Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel(`qcm-status-${courseId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'courses', filter: `id=eq.${courseId}` },
        (payload) => {
          const updated = payload.new as { qcm_status?: string }
          if (updated.qcm_status === 'ready') {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [courseId, router, supabase])

  const total = flashcards.length

  return (
    <div className="rounded-card border border-sky-border bg-sky-surface px-5 py-4 dark:border-night-border dark:bg-night-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-dark flex-shrink-0" />
          <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
            Preparation des QCM en arriere-plan...
          </p>
        </div>
        <span className="font-display text-[13px] font-bold text-brand dark:text-brand-dark">
          {total} fiches
        </span>
      </div>

      {/* Barre shimmer indeterminie */}
      <div className="h-2 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
        <div
          className="h-full rounded-pill animate-shimmer bg-gradient-to-r from-brand/40 via-brand to-brand/40 dark:from-brand-dark/40 dark:via-brand-dark dark:to-brand-dark/40 bg-[length:200%_100%]"
          style={{ width: '100%' }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
          Lis tes fiches pendant ce temps !
        </p>
        <Link
          href={`/courses/${courseId}/qcm`}
          className="font-body text-[12px] text-brand underline-offset-2 hover:underline dark:text-brand-dark"
        >
          Essayer quand meme
        </Link>
      </div>

      {error && (
        <p className="mt-2 font-body text-[12px] text-amber-600 dark:text-amber-400">
          Une erreur s'est produite — les QCM seront disponibles sous peu.
        </p>
      )}
    </div>
  )
}
