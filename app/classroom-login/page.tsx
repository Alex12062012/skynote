import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { ClassroomLoginForm } from '@/components/auth/ClassroomLoginForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connexion classe virtuelle' }

export default function ClassroomLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg px-4 dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Classe virtuelle
          </p>
        </div>
        <div className="rounded-card-login bg-sky-surface p-8 shadow-card dark:bg-night-surface">
          <h1 className="mb-2 font-display text-h3 text-text-main dark:text-text-dark-main">
            Rejoindre ma classe
          </h1>
          <p className="mb-6 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Entre le code donné par ton professeur
          </p>
          <ClassroomLoginForm />
          <p className="mt-5 text-center font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Pas élève ?{' '}
            <Link href="/login" className="font-medium text-brand hover:underline dark:text-brand-dark">
              Connexion classique
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
