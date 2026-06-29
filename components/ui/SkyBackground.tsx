'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'

export function SkyBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return resolvedTheme === 'dark' ? <NightSky /> : <DaySky />
}

// ── Étoiles : chaque étoile est STATIQUE quand elle est allumée. Elle s'allume,
//    reste fixe, s'éteint, puis (pendant qu'elle est invisible) saute à un
//    endroit aléatoire et se rallume là. En boucle. On ne la voit jamais bouger.
//    Généré côté client uniquement → Math.random() ne casse pas l'hydratation.
function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 56 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.2,
        peak: 0.45 + Math.random() * 0.5, // luminosité propre
        dur: 4.5 + Math.random() * 7, // durée d'un cycle allumage/extinction
        delay: -Math.random() * 12, // désynchronisation
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes star-blink {
          0%, 100% { opacity: 0; }
          14%      { opacity: var(--peak); }
          68%      { opacity: var(--peak); }
          86%      { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .star-dot { animation: none !important; opacity: var(--peak) !important; }
        }
      `}</style>
      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}
    </div>
  )
}

function Star({ left, top, size, peak, dur, delay }: {
  left: number; top: number; size: number; peak: number; dur: number; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Repositionne pendant la phase éteinte (opacité 0) → le déplacement est invisible.
  function jump() {
    const el = ref.current
    if (!el) return
    el.style.left = `${(Math.random() * 100).toFixed(2)}%`
    el.style.top = `${(Math.random() * 100).toFixed(2)}%`
  }

  return (
    <div
      ref={ref}
      className="star-dot absolute rounded-full bg-white"
      onAnimationIteration={jump}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        opacity: 0,
        boxShadow: `0 0 ${Math.max(2, size * 2.2).toFixed(1)}px rgba(191,219,254,${(peak * 0.6).toFixed(2)})`,
        ['--peak' as string]: peak.toFixed(3),
        animation: `star-blink ${dur.toFixed(1)}s ease-in-out ${delay.toFixed(1)}s infinite`,
      }}
    />
  )
}

// ── Nuages gauche → droite avec spawn réparti sur l'écran ─────
//
// Astuce : animationDelay négatif = le nuage est déjà "en cours de route"
// initialPct = à quel % du trajet le nuage se trouve au chargement
//
const CLOUDS = [
  { top: '8%',  width: 200, height: 72,  duration: 48, opacity: 0.35, initialPct: 15 },
  { top: '20%', width: 280, height: 95,  duration: 68, opacity: 0.28, initialPct: 52 },
  { top: '37%', width: 155, height: 58,  duration: 56, opacity: 0.22, initialPct: 78 },
  { top: '54%', width: 245, height: 85,  duration: 72, opacity: 0.18, initialPct: 33 },
  { top: '13%', width: 180, height: 65,  duration: 52, opacity: 0.30, initialPct: 65 },
]

function DaySky() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes cloud-slide-right {
          0%   { transform: translateX(-320px); }
          100% { transform: translateX(110vw); }
        }
      `}</style>
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.top,
            left: 0,
            opacity: c.opacity,
            animation: `cloud-slide-right ${c.duration}s linear infinite`,
            animationDelay: `-${(c.initialPct / 100) * c.duration}s`,
          }}
        >
          <CloudSVG width={c.width} height={c.height} />
        </div>
      ))}
    </div>
  )
}

function CloudSVG({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 280 95" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="140" cy="75" rx="130" ry="20" fill="#BFDBFE" />
      <ellipse cx="100" cy="55" rx="55"  ry="40" fill="#DBEAFE" />
      <ellipse cx="165" cy="50" rx="65"  ry="45" fill="#DBEAFE" />
      <ellipse cx="140" cy="45" rx="48"  ry="36" fill="#EFF6FF" />
    </svg>
  )
}
