import { cn } from '@/lib/utils'

interface NovaCoinProps {
  size?: number
  className?: string
}

/**
 * Logo Nova — pièce bleue avec étoile 4 branches.
 * SVG inline : fonctionne sans fichier image externe.
 * Si tu places /public/nova-coin.png plus tard, tu peux
 * basculer vers <Image src="/nova-coin.png" />.
 */
export function NovaCoin({ size = 20, className }: NovaCoinProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0 select-none', className)}
      aria-label="Nova"
    >
      {/* Ombre portée */}
      <ellipse cx="50" cy="96" rx="32" ry="4" fill="rgba(0,0,0,0.18)" />

      {/* Tranche / bord cranté */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i / 36) * Math.PI * 2
        const r1 = 46
        const r2 = 49
        const x1 = 50 + Math.cos(angle) * r1
        const y1 = 50 + Math.sin(angle) * r1
        const x2 = 50 + Math.cos(angle) * r2
        const y2 = 50 + Math.sin(angle) * r2
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#1e3a8a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )
      })}

      {/* Corps principal de la pièce */}
      <circle cx="50" cy="50" r="43" fill="url(#novaGrad)" />

      {/* Reflet haut */}
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="rgba(255,255,255,0.12)" />

      {/* Étoile 4 branches (✦) */}
      <path
        d="M50 18 C50 18 53 38 62 47 C71 56 90 50 90 50 C90 50 71 44 62 53 C53 62 50 82 50 82 C50 82 47 62 38 53 C29 44 10 50 10 50 C10 50 29 56 38 47 C47 38 50 18 50 18 Z"
        fill="url(#starGrad)"
        filter="url(#starBlur)"
      />

      <defs>
        <radialGradient id="novaGrad" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="55%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <radialGradient id="starGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </radialGradient>
        <filter id="starBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
