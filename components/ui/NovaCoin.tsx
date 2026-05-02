'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface NovaCoinProps {
  size?: number
  className?: string
}

/**
 * Logo Nova — pièce bleue 3D avec étoile 4 branches.
 * Utiliser partout où les Novas ✦ sont mentionnées,
 * comme SkyCoin l'est pour les Sky Coins.
 * Image attendue : /public/nova-coin.png
 */
export function NovaCoin({ size = 20, className }: NovaCoinProps) {
  return (
    <Image
      src="/nova-coin.png"
      alt="Nova"
      width={size}
      height={size}
      className={cn('flex-shrink-0 select-none object-contain', className)}
      draggable={false}
    />
  )
}
