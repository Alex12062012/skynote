import Link from 'next/link'
import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { LoginForm } from '@/components/auth/LoginForm'
import { GithubButton } from '@/components/auth/GithubButton'
import { Reveal } from '@/components/ui/Reveal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connexion' }

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-sky-bg px-4 dark:bg-night-bg">
      {/* Halo façon landing */}
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.10),transparent_60%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.18),transparent_60%)]" />
      <Reveal inView={false} className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Révise plus vite, réussis mieux
          </p>
        </div>
        <div className="rounded-card-login border border-sky-border bg-sky-surface p-8 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
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
        </div>
      </Reveal>
    </div>
  )
}
