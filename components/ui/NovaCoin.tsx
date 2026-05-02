import { cn } from '@/lib/utils'

interface NovaCoinProps {
  size?: number
  className?: string
}

export function NovaCoin({ size = 20, className }: NovaCoinProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0 select-none', className)}
      aria-label="Nova"
    >
      {/* Cercle bleu */}
      <circle cx="12" cy="12" r="11" fill="#1d4ed8" />

      {/* Étoile 4 branches fine et équilibrée */}
      <path
        d="M12 3.5 C12 3.5 12.9 9.5 15.5 12 C18.1 14.5 22.5 12 22.5 12 C22.5 12 18.1 9.5 15.5 12 C12.9 14.5 12 20.5 12 20.5 C12 20.5 11.1 14.5 8.5 12 C5.9 9.5 1.5 12 1.5 12 C1.5 12 5.9 14.5 8.5 12 C11.1 9.5 12 3.5 12 3.5 Z"
        fill="white"
      />
    </svg>
  )
}
