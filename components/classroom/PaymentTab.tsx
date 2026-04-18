'use client'

import { Gift } from 'lucide-react'

export function PaymentTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-card border border-sky-border bg-sky-surface shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mb-4">
        <Gift className="h-10 w-10 text-success" />
      </div>
      <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main mb-2">
        Vous avez de la chance !
      </h2>
      <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary max-w-sm">
        Skynote est entierement gratuit pour les professeurs pendant la beta. Profitez de toutes les fonctionnalites sans limite.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-pill bg-success/10 px-5 py-2.5">
        <span className="font-body text-[14px] font-bold text-success">Gratuit</span>
        <span className="font-body text-[13px] text-success/80">pour toujours (ou presque)</span>
      </div>
    </div>
  )
}