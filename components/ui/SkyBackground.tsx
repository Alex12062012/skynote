'use client'

import { useMemo, useRef } from 'react'

// Thème unique : Skynote est dark-only (pas de toggle, pas de mode clair).
// On rend toujours le ciel nocturne, plus besoin de détecter le thème.
export function SkyBackground() {
  return <NightSky />
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
