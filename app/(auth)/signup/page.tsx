import Link from 'next/link'
import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { SignupForm } from '@/components/auth/SignupForm'
import { GithubButton } from '@/components/auth/GithubButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Créer un compte' }

interface SignupPageProps {
  searchParams: Promise<{ shared?: string; fiche?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { shared, fiche } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg px-4 dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
        </div>
        <div className="rounded-card-login bg-sky-surface p-8 shadow-card dark:bg-night-surface">
          <h1 className="mb-6 font-display text-h3 text-text-main dark:text-text-dark-main">Créer un compte</h1>
          {shared && (
            <div className="mb-5 rounded-input bg-brand-soft/30 border border-brand/10 p-3 dark:bg-brand-dark-soft/30 dark:border-brand-dark/10">
              <p className="font-body text-[12px] text-brand dark:text-brand-dark">
                Un cours t'a été partagé ! Crée ton compte pour le récupérer avec ses fiches et QCM.
              </p>
            </div>
          )}
          <GithubButton label="Continuer avec GitHub" sharedCourseId={shared} ficheIndex={fiche} />
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
            <span className="font-body text-[12px] text-text-tertiary">ou</span>
            <div className="flex-1 border-t border-sky-border dark:border-night-border" />
          </div>
          <SignupForm sharedCourseId={shared} ficheIndex={fiche} />
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
