'use client'

/**
 * Texte arc-en-ciel animé.
 * Utilise des styles inline (display: inline-block) pour garantir
 * que background-clip: text fonctionne dans tous les navigateurs,
 * même quand le parent a overflow: hidden ou d'autres contraintes CSS.
 */

const RAINBOW_STYLE: React.CSSProperties = {
  background: 'linear-gradient(90deg, #ff0000, #ff6600, #ffcc00, #00ff88, #00ccff, #6600ff, #ff00cc, #ff0000)',
  backgroundSize: '300% 100%',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
  animation: 'rainbow-shift 3s linear infinite',
  display: 'inline-block',
}

interface RainbowTextProps {
  children: React.ReactNode
  className?: string
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3'
}

export function RainbowText({ children, className = '', as: Tag = 'span' }: RainbowTextProps) {
  return (
    <Tag className={className} style={RAINBOW_STYLE}>
      {children}
    </Tag>
  )
}
