import { cn } from '@/lib/utils'

interface NovaCoinProps {
  size?: number
  className?: string
}

export function NovaCoin({ size = 20, className }: NovaCoinProps) {
  const fontSize = Math.round(size * 0.85)
  return (
    <span
      className={cn('flex-shrink-0 select-none leading-none', className)}
      style={{ fontSize, color: '#6366f1', lineHeight: 1 }}
      aria-label="Nova"
    >
      ✦
    </span>
  )
}
