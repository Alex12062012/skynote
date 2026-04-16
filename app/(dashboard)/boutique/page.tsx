import { ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Boutique — Skynote' }

export default function BoutiquePage() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
          Boutique
        </h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Depense tes Sky Coins pour debloquer des recompenses
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-sky-border py-24 text-center dark:border-night-border">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-cloud dark:bg-night-border">
          <ShoppingBag className="h-8 w-8 text-text-tertiary dark:text-text-dark-tertiary" />
        </div>
        <div>
          <p className="font-display text-h4 text-text-main dark:text-text-dark-main">
            Bientot disponible
          </p>
          <p className="mt-1 max-w-xs font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            La boutique arrive prochainement. Tu pourras y depenser tes Sky Coins !
          </p>
        </div>
      </div>
    </div>
  )
}
