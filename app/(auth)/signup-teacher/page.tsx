import Link from 'next/link'
import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { TeacherSignupForm } from '@/components/auth/TeacherSignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Créer une classe virtuelle' }

export default function SignupTeacherPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg px-4 dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
        </div>
        <div className="rounded-card-login bg-sky-surface p-8 shadow-card dark:bg-night-surface">
          <h1 className="mb-2 font-display text-h3 text-text-main dark:text-text-dark-main">
            Classe virtuelle
          </h1>
          <p className="mb-6 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Créez un espace pour vos élèves — gratuit en bêta
          </p>
          <TeacherSignupForm />
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
