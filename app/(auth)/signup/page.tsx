import Link from 'next/link'
import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { SignupForm } from '@/components/auth/SignupForm'
import { GoogleButton } from '@/components/auth/GoogleButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Créer un compte' }

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg px-4 dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
        </div>
        <div className="rounded-card-login bg-sky-surface p-8 shadow-card dark:bg-night-surface">
          <h1 className="mb-6 font-display text-h3 text-text-main dark:text-text-dark-main">Créer un compte</h1>
          <GoogleButton label="Continuer avec Google" />
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
            <span className="font-body text-[12px] text-text-tertiary">ou</span>
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
          </div>
          <SignupForm />
          <p className="mt-5 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-brand hover:underline dark:text-brand-dark">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
