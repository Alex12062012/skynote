'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.23, 1, 0.32, 1] as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE, delay: i * 0.07 } }),
}

/**
 * Entrée sobre et réutilisable pour les sections/cartes de l'app.
 * - `i` : index pour décaler (stagger).
 * - `inView` : déclenche au scroll (par défaut) ou à l'apparition immédiate.
 * Respecte prefers-reduced-motion (rendu instantané).
 */
export function Reveal({
  children,
  className,
  i = 0,
  inView = true,
}: {
  children: React.ReactNode
  className?: string
  i?: number
  inView?: boolean
}) {
  const reduce = useReducedMotion()
  const trigger = inView
    ? { whileInView: 'show' as const, viewport: { once: true, amount: 0.2 } }
    : { animate: 'show' as const }
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={i}
      initial={reduce ? false : 'hidden'}
      {...(reduce ? {} : trigger)}
    >
      {children}
    </motion.div>
  )
}
