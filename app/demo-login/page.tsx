import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { DemoLoginForm } from '@/components/auth/DemoLoginForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Démo classe virtuelle' }

export default function DemoLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg px-4 dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Démo classe virtuelle
          </p>
        </div>
        <div className="rounded-card-login bg-sky-surface p-8 shadow-card dark:bg-night-surface">
          <h1 className="mb-2 font-display text-h3 text-text-main dark:text-text-dark-main">
            Connexion démo
          </h1>
          <p className="mb-6 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Tape un code pour tester
          </p>
          <DemoLoginForm />
          <div className="mt-5 rounded-input bg-sky-bg p-3 dark:bg-night-bg">
            <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary mb-2">Comptes de test :</p>
            <p className="font-mono text-[13px] text-brand dark:text-brand-dark">mdubois253912 <span className="text-text-tertiary text-[11px]">→ Prof</span></p>
            <p className="font-mono text-[13px] text-brand dark:text-brand-dark">aroudaut253912 <span className="text-text-tertiary text-[11px]">→ Élève</span></p>
          </div>
          <p className="mt-4 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            <Link href="/login" className="font-medium text-brand hover:underline dark:text-brand-dark">
              Connexion classique
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
