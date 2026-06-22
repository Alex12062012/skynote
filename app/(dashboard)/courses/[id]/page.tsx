import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCourse, getCourseFlashcards } from '@/lib/supabase/queries'
import { EditableTitle } from '@/components/courses/EditableTitle'
import { ProcessingLoader } from '@/components/courses/ProcessingLoader'
import { GenerationTrigger } from '@/components/courses/GenerationTrigger'
import { CourseErrorState } from '@/components/courses/CourseErrorState'
import { FlashcardViewer } from '@/components/courses/FlashcardViewer'
import { QcmGenerator } from '@/components/courses/QcmGenerator'
import { CourseChat } from '@/components/courses/CourseChat'
import { getUserPlanLimits } from '@/lib/supabase/plan'
import { DeleteCourseButton } from '@/components/courses/DeleteCourseButton'
import { SubjectBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { getServerLocale, createServerT } from '@/lib/i18n/server'
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
  const locale = await getServerLocale()
  const t = createServerT(locale)
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
        {t('courseDetail.back')}
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
          <EditableTitle courseId={id} initialTitle={course.title} canEdit={true} />
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

      {course.status === 'error' && <CourseErrorState courseId={id} userId={user.id} />}

      {course.status === 'ready' && (
        <ReadyCourse
          courseId={id}
          userId={user.id}
          courseTitle={course.title}
        />
      )}
    </div>
  )
}

async function ReadyCourse({ courseId, userId, courseTitle }: { courseId: string; userId: string; courseTitle: string }) {
  const supabase = await createClient()
  const flashcards = await getCourseFlashcards(courseId)

  // Verifier si des questions existent reellement
  let qcmReady = false
  if (flashcards.length > 0) {
    const flashcardIds = flashcards.map((f) => f.id)
    const { count } = await supabase
      .from('qcm_questions')
      .select('*', { count: 'exact', head: true })
      .in('flashcard_id', flashcardIds)
      .eq('user_id', userId)
    qcmReady = (count ?? 0) > 0
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-sky-border p-8 text-center dark:border-night-border">
        <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Aucune fiche generee. Le contenu etait peut-etre trop court.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* QCM en cours de generation uniquement */}
      {!qcmReady && (
        <QcmGenerator
          courseId={courseId}
          flashcards={flashcards.map(f => ({ id: f.id, title: f.title }))}
        />
      )}

      {/* Chatbot IA */}
      <CourseChat
        courseId={courseId}
        courseTitle={courseTitle}
        isPremium={(await getUserPlanLimits(userId)).isStarter}
      />

      {/* Fiches avec bouton QCM contextuel */}
      <FlashcardViewer flashcards={flashcards} courseId={courseId} userId={userId} qcmReady={qcmReady} />
    </div>
  )
}
