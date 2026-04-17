'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { useI18n } from '@/lib/i18n/context'

const MESSAGES = [
  "L'IA lit ton cours...",
  "L'IA génère tes fiches de révision...",
  "L'IA structure les points essentiels...",
  "L'IA rédige tes résumés...",
  "L'IA prépare tes questions QCM...",
  "L'IA vérifie la qualité des fiches...",
  'Finalisation en cours...',
]

interface ProcessingLoaderProps {
  courseId: string
  courseTitle: string
}

export function ProcessingLoader({ courseId, courseTitle }: ProcessingLoaderProps) {
  const router = useRouter()
  const [messageIndex, setMessageIndex] = useState(0)
  const [barProgress, setBarProgress] = useState(5)
  const supabase = createClient()

  // Cycler les messages et avancer la barre
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
      setBarProgress((p) => (p < 88 ? p + 7 : p))
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  // Écoute realtime Supabase — se déclenche quand le cours est prêt
  useEffect(() => {
    const channel = supabase
      .channel(`course-status-${courseId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'courses', filter: `id=eq.${courseId}` },
        (payload) => {
          const updated = payload.new as { status: string; progress: number }
          if (updated.status === 'ready') {
            setBarProgress(100)
            setTimeout(() => router.refresh(), 600)
          } else if (updated.status === 'error') {
            router.refresh()
          } else if (updated.progress) {
            setBarProgress(Math.max(barProgress, updated.progress))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [courseId, router, supabase])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center animate-fade-in">
      {/* Sky Coin qui tourne — effet flip de pièce */}
      <div style={{ perspective: '400px' }}>
        <div
          style={{
            animation: 'coin-flip 1.6s ease-in-out infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          <style>{`
            @keyframes coin-flip {
              0%   { transform: rotateY(0deg) scale(1); }
              40%  { transform: rotateY(90deg) scale(0.85); }
              50%  { transform: rotateY(90deg) scale(0.85); }
              90%  { transform: rotateY(0deg) scale(1); }
              100% { transform: rotateY(0deg) scale(1); }
            }
          `}</style>
          <SkyCoin size={72} />
        </div>
      </div>

      {/* Texte animé */}
      <div className="space-y-2">
        <h2 className="font-display text-[22px] font-semibold text-text-main dark:text-text-dark-main">
          {courseTitle}
        </h2>
        <p
          key={messageIndex}
          className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary animate-fade-in"
        >
          {MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Barre de progression IA avec shimmer */}
      <div className="w-full max-w-xs space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
          <div
            className="relative h-full rounded-pill transition-all duration-700 ease-out overflow-hidden"
            style={{
              width: `${barProgress}%`,
              background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
            }}
          >
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]" />
          </div>
        </div>
        <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary tabular-nums">
          {barProgress}%
        </p>
      </div>

      <p className="max-w-xs font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
        La génération prend 15 à 30 secondes selon la longueur du cours.
      </p>
    </div>
  )
}
