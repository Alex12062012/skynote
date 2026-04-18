import { SkynoteLogo } from '@/components/ui/SkyCoin'
import { TeacherCodeLoginForm } from '@/components/auth/TeacherCodeLoginForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connexion professeur' }

export default function TeacherLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg px-4 dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <SkynoteLogo />
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Espace professeur
          </p>
        </div>
        <div className="rounded-card-login bg-sky-surface p-8 shadow-card dark:bg-night-surface">
          <h1 className="mb-2 font-display text-h3 text-text-main dark:text-text-dark-main">
            Connexion rapide
          </h1>
          <p className="mb-6 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Entre ton code professeur pour acceder directement a ton tableau de bord
          </p>
          <TeacherCodeLoginForm />
          <div className="mt-5 flex flex-col gap-2 text-center">
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Premiere connexion ?{' '}
              <Link href="/login" className="font-medium text-brand hover:underline dark:text-brand-dark">
                Connexion avec email
              </Link>
            </p>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Pas encore de compte ?{' '}
              <Link href="/signup-teacher" className="font-medium text-brand hover:underline dark:text-brand-dark">
                Creer une classe
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
