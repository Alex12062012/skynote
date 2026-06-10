import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getSharedCourse } from '@/lib/supabase/claim-actions'
import { PublicCourseViewer } from '@/components/courses/PublicCourseViewer'
import { ClaimCourseButton } from '@/components/courses/ClaimCourseButton'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const shared = await getSharedCourse(id)

  if (!shared) return { title: 'Cours — Skynote' }

  return {
    title: `${shared.course.title} — Cours Skynote`,
    description: `${shared.flashcards.length} fiches de révision sur ${shared.course.subject}`,
    openGraph: {
      title: `${shared.course.title} — Cours Skynote`,
      description: `${shared.flashcards.length} fiches de révision sur ${shared.course.subject}`,
      siteName: 'Skynote',
    },
  }
}

export default async function SharedCoursePage({ params }: Props) {
  const { id } = await params
  const shared = await getSharedCourse(id)
  if (!shared) notFound()

  const { course, flashcards } = shared

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnCourse = !!user && user.id === course.user_id

  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg">
      {/* Header minimal */}
      <header className="border-b border-sky-border bg-sky-surface/80 backdrop-blur-lg dark:border-night-border dark:bg-night-surface/80">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
            Skynote
          </Link>
          {user ? (
            <ClaimCourseButton courseId={course.id} isOwnCourse={isOwnCourse} />
          ) : (
            <Link href={`/signup?shared=${course.id}`}
              className="flex items-center gap-1.5 rounded-input bg-brand px-3.5 py-1.5 font-body text-[13px] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-brand-dark dark:text-night-bg">
              Créer un compte gratuit
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* Fil d'ariane matière */}
        <p className="mb-3 font-body text-[12px] uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
          {course.subject} · {flashcards.length} fiches
        </p>

        {/* Titre du cours */}
        <h1 className="mb-6 font-display text-[26px] font-bold leading-tight text-text-main dark:text-text-dark-main sm:text-[30px]">
          {course.title}
        </h1>

        <PublicCourseViewer
          flashcards={flashcards}
          courseId={course.id}
          isOwnCourse={isOwnCourse}
          qcmReady={course.qcm_status === 'ready'}
        />

        {/* CTA inscription, uniquement pour les visiteurs sans compte */}
        {!user && (
          <div className="mt-12 rounded-card border border-brand/20 bg-brand-soft p-6 text-center dark:border-brand-dark/20 dark:bg-brand-dark-soft">
            <p className="font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
              Reçois ce cours dans ton compte
            </p>
            <p className="mt-1.5 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              Crée un compte gratuit : ce cours et ses QCM seront automatiquement ajoutés chez toi.
            </p>
            <Link href={`/signup?shared=${course.id}`}
              className="mt-5 inline-flex items-center gap-2 rounded-input bg-brand px-5 py-2.5 font-body text-[15px] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-brand-dark dark:text-night-bg">
              Essayer Skynote — c'est gratuit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
