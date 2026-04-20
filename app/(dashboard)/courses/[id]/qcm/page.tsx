import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCourse, getCourseFlashcards } from '@/lib/supabase/queries'
import { QcmPageClient } from '@/components/qcm/QcmPageClient'
import { QcmProcessingPoller } from '@/components/qcm/QcmProcessingPoller'
import { SubjectBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Metadata } from 'next'
import type { QcmQuestion } from '@/types/database'
import { getServerLocale, createServerT } from '@/lib/i18n/server'

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'QCM' }

export default async function QcmPage({ params }: Props) {
  const locale = await getServerLocale()
  const t = createServerT(locale)

  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const course = await getCourse(id, user.id)
  if (!course) notFound()

  if (course.status !== 'ready') {
    redirect(`/courses/${id}`)
  }

  // Si les QCM sont encore en cours de génération → vérifier si des questions existent quand même
  if ((course as any).qcm_status === 'processing') {
    // Vérifier si des questions existent déjà (cas élève : le prof a généré mais qcm_status pas encore à jour)
    const flashcardsForCheck = await getCourseFlashcards(id)
    const flashcardIdsForCheck = flashcardsForCheck.map((f) => f.id)
    let hasExistingQuestions = false
    if (flashcardIdsForCheck.length > 0) {
      const { count } = await supabase
        .from('qcm_questions')
        .select('*', { count: 'exact', head: true })
        .in('flashcard_id', flashcardIdsForCheck)
        .eq('user_id', course.user_id)
      hasExistingQuestions = (count ?? 0) > 0
    }

    if (!hasExistingQuestions) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
          <QcmProcessingPoller courseId={id} />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent dark:border-brand-dark" />
          </div>
          <div>
            <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main mb-2">
              {t('qcmPage.generating')}
            </h2>
            <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary max-w-sm">
              {t('qcmPage.generatingDesc')}
            </p>
          </div>
          <Link href={`/courses/${id}`} className="font-body text-[13px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary transition-colors">
            <ArrowLeft className="inline h-3.5 w-3.5 mr-1" />{t('qcmPage.back')}
          </Link>
        </div>
      )
    }
    // Des questions existent → continuer comme si le QCM était prêt
  }

  const flashcards = await getCourseFlashcards(id)

  if (flashcards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <Link href={`/courses/${id}`} className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('qcmPage.back')}
        </Link>
        <EmptyState title={t('qcmPage.noFlashcards')} description={t('qcmPage.noFlashcardsDesc')} />
      </div>
    )
  }

  // Récupérer toutes les questions pour toutes les fiches et tous les niveaux
  // Pour les élèves, les questions sont celles du prof (user_id = course.user_id)
  const flashcardIds = flashcards.map((f) => f.id)
  const { data: rawQuestions } = await supabase
    .from('qcm_questions')
    .select('*')
    .in('flashcard_id', flashcardIds)
    .eq('user_id', course.user_id)

  const allQuestions = (rawQuestions ?? []) as QcmQuestion[]

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Back */}
      <Link
        href={`/courses/${id}`}
        className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('qcmPage.back')}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-6 w-6 text-brand dark:text-brand-dark" />
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            QCM
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <SubjectBadge subject={course.subject} />
          <span className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary truncate">
            {course.title}
          </span>
        </div>
        <p className="mt-2 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          {t('qcmPage.subtitle')}
        </p>
      </div>

      {/* QCM Engine */}
      <QcmPageClient
        flashcards={flashcards}
        allQuestions={allQuestions}
        courseId={id}
      />
    </div>
  )
}
