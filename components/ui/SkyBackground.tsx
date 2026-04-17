'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function SkyBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return resolvedTheme === 'dark' ? <NightSky /> : <DaySky />
}

// ── Étoiles dispersées naturellement ──────────────────────────
const STARS = [
  { x: 8,  y: 5,  size: 2,   delay: 0,   duration: 4.2 },
  { x: 23, y: 12, size: 1.5, delay: 0.8, duration: 5.1 },
  { x: 41, y: 3,  size: 2.5, delay: 1.6, duration: 3.8 },
  { x: 67, y: 8,  size: 1,   delay: 0.3, duration: 6.0 },
  { x: 84, y: 15, size: 2,   delay: 2.1, duration: 4.5 },
  { x: 92, y: 4,  size: 1.5, delay: 0.9, duration: 5.3 },
  { x: 15, y: 22, size: 1,   delay: 3.2, duration: 4.8 },
  { x: 55, y: 18, size: 2,   delay: 1.1, duration: 5.6 },
  { x: 76, y: 25, size: 1.5, delay: 2.5, duration: 3.9 },
  { x: 33, y: 31, size: 1,   delay: 0.6, duration: 6.2 },
  { x: 48, y: 9,  size: 2.5, delay: 1.8, duration: 4.1 },
  { x: 89, y: 33, size: 1,   delay: 3.7, duration: 5.4 },
  { x: 6,  y: 40, size: 1.5, delay: 2.0, duration: 4.7 },
  { x: 72, y: 42, size: 2,   delay: 0.4, duration: 5.9 },
  { x: 19, y: 55, size: 1,   delay: 1.3, duration: 3.6 },
  { x: 38, y: 48, size: 2,   delay: 4.1, duration: 4.3 },
  { x: 61, y: 52, size: 1.5, delay: 0.7, duration: 5.7 },
  { x: 94, y: 47, size: 1,   delay: 2.8, duration: 6.1 },
  { x: 27, y: 67, size: 2,   delay: 1.5, duration: 4.0 },
  { x: 53, y: 63, size: 1,   delay: 3.3, duration: 5.2 },
  { x: 79, y: 58, size: 2.5, delay: 0.2, duration: 4.6 },
  { x: 12, y: 74, size: 1.5, delay: 2.6, duration: 5.8 },
  { x: 44, y: 71, size: 1,   delay: 1.9, duration: 3.7 },
  { x: 87, y: 69, size: 2,   delay: 3.5, duration: 4.4 },
  { x: 31, y: 82, size: 1,   delay: 0.5, duration: 6.3 },
  { x: 65, y: 78, size: 1.5, delay: 2.3, duration: 5.0 },
  { x: 96, y: 85, size: 2,   delay: 1.0, duration: 4.9 },
  { x: 4,  y: 88, size: 1,   delay: 3.9, duration: 5.5 },
  { x: 58, y: 91, size: 2,   delay: 1.7, duration: 4.2 },
  { x: 82, y: 93, size: 1.5, delay: 2.9, duration: 3.5 },
]

function NightSky() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes star-twinkle-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(1.3); }
        }
      `}</style>
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: 0.15,
            animation: `star-twinkle-slow ${star.duration}s ease-in-out ${star.delay}s infinite`,
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
