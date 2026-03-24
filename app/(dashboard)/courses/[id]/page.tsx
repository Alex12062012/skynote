import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCourse, getCourseFlashcards } from '@/lib/supabase/queries'
import { ProcessingLoader } from '@/components/courses/ProcessingLoader'
import { GenerationTrigger } from '@/components/courses/GenerationTrigger'
import { FlashcardViewer } from '@/components/courses/FlashcardViewer'
import { QcmGenerator } from '@/components/courses/QcmGenerator'
import { DeleteCourseButton } from '@/components/courses/DeleteCourseButton'
import { SubjectBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { title: 'Cours' }
  const course = await getCourse(id, user.id)
  return { title: course?.title ?? 'Cours' }
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const course = await getCourse(id, user.id)
  if (!course) notFound()

  const SOURCE_LABELS: Record<string, string> = { text: 'Texte', pdf: 'PDF', photo: 'Photo', vocal: 'Vocal' }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Back */}
      <Link href="/courses"
        className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Mes cours
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SubjectBadge subject={course.subject} />
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              {SOURCE_LABELS[course.source_type] ?? course.source_type}
            </span>
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              · {formatDate(course.created_at)}
            </span>
          </div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main leading-tight">
            {course.title}
          </h1>
        </div>
        <DeleteCourseButton courseId={id} courseTitle={course.title} />
      </div>

      {/* Contenu selon status */}
      {course.status === 'processing' && (
        <>
          <GenerationTrigger courseId={id} />
          <ProcessingLoader courseId={id} courseTitle={course.title} />
        </>
      )}

      {course.status === 'error' && (
        <div className="flex flex-col items-center gap-4 rounded-card border border-error/20 bg-error/5 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-error" />
          <div>
            <h2 className="font-display text-h4 text-text-main dark:text-text-dark-main">Erreur de génération</h2>
            <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              L'IA n'a pas pu générer les fiches. Vérifie que le contenu de ton cours est suffisamment long.
            </p>
          </div>
          <GenerationTrigger courseId={id} />
          <Button onClick={() => window.location.reload()} variant="secondary">Réessayer</Button>
        </div>
      )}

      {course.status === 'ready' && <ReadyCourse courseId={id} userId={user.id} qcmStatus={(course as any).qcm_status} />}
    </div>
  )
}

async function ReadyCourse({ courseId, userId, qcmStatus }: { courseId: string; userId: string; qcmStatus?: string }) {
  const flashcards = await getCourseFlashcards(courseId)
  const qcmReady = qcmStatus === 'ready' || !qcmStatus

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-sky-border p-8 text-center dark:border-night-border">
        <p className="text-4xl">🤔</p>
        <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Aucune fiche générée. Le contenu était peut-être trop court.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* QCM en cours ou prêt */}
      {!qcmReady ? (
        <QcmGenerator
          courseId={courseId}
          flashcards={flashcards.map(f => ({ id: f.id, title: f.title }))}
        />
      ) : (
        <div className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface-2 px-5 py-4 dark:border-night-border dark:bg-night-surface-2">
          <div>
            <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
              {flashcards.length} fiches générées ✨
            </p>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Score parfait au QCM = +10 Sky Coins
            </p>
          </div>
          <Link href={`/courses/${courseId}/qcm`}>
            <Button size="sm" className="gap-1.5 flex-shrink-0">
              <Zap className="h-4 w-4" />
              Faire le QCM
            </Button>
          </Link>
        </div>
      )}

      <FlashcardViewer flashcards={flashcards} courseId={courseId} userId={userId} />
    </div>
  )
}
