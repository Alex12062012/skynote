'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'

export function SkyBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return resolvedTheme === 'dark' ? <NightSky /> : <DaySky />
}

// ── Étoiles : chacune erre où elle veut (trajectoire aléatoire) et a sa
//    propre luminosité. Généré côté client uniquement (NightSky ne rend
//    qu'après le montage), donc Math.random() ne casse pas l'hydratation.
function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 52 }, () => {
        const dx = (Math.random() * 2 - 1) * (18 + Math.random() * 55)
        const dy = (Math.random() * 2 - 1) * (18 + Math.random() * 55)
        return {
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: 1 + Math.random() * 2.2,
          base: 0.04 + Math.random() * 0.14,   // luminosité basse propre
          peak: 0.4 + Math.random() * 0.58,    // luminosité haute propre
          dx, dy,
          dur: 9 + Math.random() * 17,
          delay: -Math.random() * 24,
        }
      }),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes star-wander {
          0%   { transform: translate(0, 0);                                          opacity: var(--base); }
          20%  { transform: translate(var(--dx), var(--dy));                           opacity: var(--peak); }
          40%  { transform: translate(calc(var(--dx) * -0.5), calc(var(--dy) * 0.85)); opacity: var(--base); }
          60%  { transform: translate(calc(var(--dx) * 0.7),  calc(var(--dy) * -0.6)); opacity: var(--peak); }
          80%  { transform: translate(calc(var(--dx) * -0.3), calc(var(--dy) * -0.9)); opacity: var(--base); }
          100% { transform: translate(0, 0);                                          opacity: var(--base); }
        }
      `}</style>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.base,
            boxShadow: `0 0 ${Math.max(2, s.size * 2.2)}px rgba(191,219,254,${(s.peak * 0.6).toFixed(2)})`,
            ['--base' as string]: s.base.toFixed(3),
            ['--peak' as string]: s.peak.toFixed(3),
            ['--dx' as string]: `${s.dx.toFixed(1)}px`,
            ['--dy' as string]: `${s.dy.toFixed(1)}px`,
            animation: `star-wander ${s.dur.toFixed(1)}s ease-in-out ${s.delay.toFixed(1)}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── Nuages gauche → droite avec spawn réparti sur l'écran ─────
//
// Astuce : animationDelay négatif = le nuage est déjà "en cours de route"
// initialPct = à quel % du trajet le nuage se trouve au chargement
// Ex: initialPct=40 sur duration=60s → delay = -(40/100)*60 = -24s
// Le nuage apparaît donc à 40% de la largeur de l'écran dès le départ
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
            // Delay négatif = nuage déjà en cours de route à son initialPct
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
