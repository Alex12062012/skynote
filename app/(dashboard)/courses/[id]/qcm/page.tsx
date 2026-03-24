import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCourse, getCourseFlashcards } from '@/lib/supabase/queries'
import { QcmPageClient } from '@/components/qcm/QcmPageClient'
import { SubjectBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Metadata } from 'next'
import type { QcmQuestion } from '@/types/database'

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'QCM' }

export default async function QcmPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const course = await getCourse(id, user.id)
  if (!course) notFound()

  if (course.status !== 'ready') {
    redirect(`/courses/${id}`)
  }

  // Si les QCM sont encore en cours de génération → page de chargement
  if ((course as any).qcm_status === 'processing') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent dark:border-brand-dark" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main mb-2">
            Génération des QCM en cours...
          </h2>
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary max-w-sm">
            Tes fiches sont prêtes ! Les questions QCM sont en cours de création. Reviens dans quelques secondes.
          </p>
        </div>
        <a href={`/courses/${id}/qcm`}
          className="flex items-center gap-2 rounded-input border border-sky-border bg-sky-surface px-5 py-2.5 font-body text-[14px] font-medium text-text-main hover:bg-sky-cloud dark:border-night-border dark:bg-night-surface dark:text-text-dark-main transition-colors">
          🔄 Actualiser
        </a>
        <a href={`/courses/${id}`}
          className="font-body text-[13px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary transition-colors">
          ← Retour aux fiches
        </a>
      </div>
    )
  }

  const flashcards = await getCourseFlashcards(id)

  if (flashcards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <Link href={`/courses/${id}`} className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux fiches
        </Link>
        <EmptyState icon="📭" title="Aucune fiche disponible" description="Les fiches doivent être générées avant de pouvoir faire le QCM." />
      </div>
    )
  }

  // Récupérer toutes les questions pour toutes les fiches
  const flashcardIds = flashcards.map((f) => f.id)
  const { data: allQuestions } = await supabase
    .from('qcm_questions')
    .select('*')
    .in('flashcard_id', flashcardIds)
    .eq('user_id', user.id)

  // Grouper par fiche
  const questions = (allQuestions ?? []) as QcmQuestion[]
  const questionsByFlashcard: Record<string, QcmQuestion[]> = {}
  for (const fid of flashcardIds) {
    questionsByFlashcard[fid] = questions.filter((q) => q.flashcard_id === fid)
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Back */}
      <Link
        href={`/courses/${id}`}
        className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux fiches
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
          Réponds aux questions générées par l'IA. Score parfait = <strong className="text-brand dark:text-brand-dark">+10 Sky Coins ⚡</strong>
        </p>
      </div>

      {/* QCM Engine */}
      <QcmPageClient
        flashcards={flashcards}
        questionsByFlashcard={questionsByFlashcard}
        courseId={id}
      />
    </div>
  )
}
