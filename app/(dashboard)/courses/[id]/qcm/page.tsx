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
