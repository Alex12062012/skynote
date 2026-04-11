import Link from 'next/link'
import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { LoginForm } from '@/components/auth/LoginForm'
import { GithubButton } from '@/components/auth/GithubButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connexion' }

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg px-4 dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Révise plus vite, réussis mieux
          </p>
        </div>
        <div className="rounded-card-login bg-sky-surface p-8 shadow-card dark:bg-night-surface dark:shadow-card-dark">
          <h1 className="mb-6 font-display text-h3 text-text-main dark:text-text-dark-main">Connexion</h1>
          {searchParams.error && (
            <div className="mb-4 rounded-input bg-error/10 px-4 py-3 font-body text-[13px] text-error border border-error/20">
              Une erreur est survenue. Réessaie.
            </div>
          )}
          <GithubButton />
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">ou</span>
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
          </div>
          <LoginForm />
          <p className="mt-5 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-medium text-brand hover:underline dark:text-brand-dark">
              Créer un compte
            </Link>
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
            <span className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">accès rapide</span>
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/classroom-login"
              className="flex items-center justify-center gap-1.5 rounded-input border border-sky-border bg-sky-bg py-2.5 font-body text-[12px] font-medium text-text-secondary transition-colors hover:border-brand hover:text-brand dark:border-night-border dark:bg-night-bg dark:text-text-dark-secondary dark:hover:border-brand-dark dark:hover:text-brand-dark">
              🎒 Élève
            </Link>
            <Link href="/teacher-login"
              className="flex items-center justify-center gap-1.5 rounded-input border border-sky-border bg-sky-bg py-2.5 font-body text-[12px] font-medium text-text-secondary transition-colors hover:border-brand hover:text-brand dark:border-night-border dark:bg-night-bg dark:text-text-dark-secondary dark:hover:border-brand-dark dark:hover:text-brand-dark">
              👨‍🏫 Professeur
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
