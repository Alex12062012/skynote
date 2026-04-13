import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCourse, getCourseFlashcards } from '@/lib/supabase/queries'
import { EditableTitle } from '@/components/courses/EditableTitle'
import { ProcessingLoader } from '@/components/courses/ProcessingLoader'
import { GenerationTrigger } from '@/components/courses/GenerationTrigger'
import { FlashcardViewer } from '@/components/courses/FlashcardViewer'
import { QcmGenerator } from '@/components/courses/QcmGenerator'
import { CourseChat } from '@/components/courses/CourseChat'
import { getUserPlanLimits } from '@/lib/supabase/plan'
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

  const { data: profile } = await supabase.from('profiles').select('role, classroom_id').eq('id', user.id).single()
  const isStudent = profile?.role === 'student'
  const isTeacher = profile?.role === 'teacher'

  // For students: fetch the folder name to display instead of the generic subject
  let folderName: string | null = null
  if (isStudent) {
    const { data: courseWithFolder } = await supabase
      .from('courses')
      .select('folder_id')
      .eq('id', id)
      .single()
    if (courseWithFolder?.folder_id) {
      const { data: folder } = await supabase
        .from('course_folders')
        .select('name')
        .eq('id', courseWithFolder.folder_id)
        .single()
      folderName = folder?.name ?? null
    }
  }

  const SOURCE_LABELS: Record<string, string> = { text: 'Texte', pdf: 'PDF', photo: 'Photo', vocal: 'Vocal' }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Back */}
      <Link href="/courses"
        className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {isStudent ? 'Cours de la classe' : 'Mes cours'}
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {folderName ? (
              <SubjectBadge subject={folderName} />
            ) : (
              <SubjectBadge subject={course.subject} />
            )}
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              {SOURCE_LABELS[course.source_type] ?? course.source_type}
            </span>
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              · {formatDate(course.created_at)}
            </span>
          </div>
          <EditableTitle courseId={id} initialTitle={course.title} canEdit={!isStudent} />
        </div>
        {!isStudent && <DeleteCourseButton courseId={id} courseTitle={course.title} />}
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
          <a href=""><Button variant="secondary">Réessayer</Button></a>
        </div>
      )}

      {course.status === 'ready' && <ReadyCourse courseId={id} userId={user.id} courseTitle={course.title} qcmStatus={(course as any).qcm_status} isTeacher={isTeacher} isStudent={isStudent} />}
    </div>
  )
}

async function ReadyCourse({ courseId, userId, courseTitle, qcmStatus, isTeacher, isStudent }: { courseId: string; userId: string; courseTitle: string; qcmStatus?: string; isTeacher: boolean; isStudent: boolean }) {
  const supabase = await createClient()
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
      {/* Vue PROF : stats des élèves */}
      {isTeacher ? (
        <TeacherCourseStats courseId={courseId} flashcardsCount={flashcards.length} />
      ) : isStudent ? (
        /* Vue ÉLÈVE : jamais de QcmGenerator, le QCM appartient au prof */
        qcmReady ? (
          <div className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface-2 px-5 py-4 dark:border-night-border dark:bg-night-surface-2">
            <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
              {flashcards.length} fiches générées ✨
            </p>
            <Link href={`/courses/${courseId}/qcm`}>
              <Button size="sm" className="gap-1.5 flex-shrink-0">
                <Zap className="h-4 w-4" />
                Faire le QCM
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface-2 px-5 py-4 dark:border-night-border dark:bg-night-surface-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-dark flex-shrink-0" />
            <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              Le QCM est en cours de préparation par ton prof...
            </p>
          </div>
        )
      ) : (
        <>
          {/* Vue PARTICULIER : QCM en cours ou prêt */}
          {!qcmReady ? (
            <QcmGenerator
              courseId={courseId}
              flashcards={flashcards.map(f => ({ id: f.id, title: f.title }))}
            />
          ) : (
            <div className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface-2 px-5 py-4 dark:border-night-border dark:bg-night-surface-2">
              <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
                {flashcards.length} fiches générées ✨
              </p>
              <Link href={`/courses/${courseId}/qcm`}>
                <Button size="sm" className="gap-1.5 flex-shrink-0">
                  <Zap className="h-4 w-4" />
                  Faire le QCM
                </Button>
              </Link>
            </div>
          )}

          {/* Chatbot IA */}
          <CourseChat courseId={courseId} courseTitle={courseTitle} isPremium={(await getUserPlanLimits(userId)).isPlus} />
        </>
      )}

      <FlashcardViewer flashcards={flashcards} courseId={courseId} userId={userId} />
    </div>
  )
}

async function TeacherCourseStats({ courseId, flashcardsCount }: { courseId: string; flashcardsCount: number }) {
  const supabase = await createClient()

  // Récupérer la classe du prof
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', user.id)
    .single()

  if (!classroom) return null

  // Récupérer les élèves de la classe
  const { data: classStudents } = await supabase
    .from('classroom_students')
    .select('id, first_name, last_name, login_code')
    .eq('classroom_id', classroom.id)
    .order('last_name')

  // Récupérer les profils élèves liés à cette classe
  const { data: studentProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, classroom_student_id')
    .eq('classroom_id', classroom.id)
    .eq('role', 'student')

  // Récupérer les tentatives QCM de chaque élève pour ce cours
  const studentIds = (studentProfiles || []).map(p => p.id)
  let attempts: any[] = []
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('qcm_attempts')
      .select('user_id, score, total, perfect, created_at')
      .eq('flashcard_id', courseId)
      .in('user_id', studentIds)
    // Aussi chercher par course_id dans qcm_questions
    const { data: courseAttempts } = await supabase
      .from('qcm_attempts')
      .select('user_id, score, total, perfect, created_at')
      .in('user_id', studentIds)
    attempts = courseAttempts || []
  }

  // Map des tentatives par user_id
  const attemptsByUser = new Map<string, any[]>()
  for (const a of attempts) {
    const list = attemptsByUser.get(a.user_id) || []
    list.push(a)
    attemptsByUser.set(a.user_id, list)
  }

  return (
    <div className="rounded-card bg-sky-surface p-6 shadow-card dark:bg-night-surface">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
          <span className="text-lg">📊</span>
        </div>
        <div>
          <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">
            Suivi des élèves
          </h2>
          <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            {flashcardsCount} fiches · {classStudents?.length || 0} élèves
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {(classStudents || []).map((student) => {
          const studentProfile = (studentProfiles || []).find(
            (p: any) => p.classroom_student_id === student.id || p.full_name === `${student.first_name} ${student.last_name}`
          )
          const userAttempts = studentProfile ? (attemptsByUser.get(studentProfile.id) || []) : []
          const hasAttempted = userAttempts.length > 0
          const bestAttempt = userAttempts.reduce((best: any, a: any) => {
            if (!best || a.score / a.total > best.score / best.total) return a
            return best
          }, null)

          return (
            <div key={student.id} className="flex items-center justify-between rounded-input bg-sky-bg px-4 py-3 dark:bg-night-bg">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${hasAttempted ? 'bg-success/10 text-success' : 'bg-sky-cloud text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary'}`}>
                  {student.first_name[0]}{student.last_name[0]}
                </div>
                <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
                  {student.first_name} {student.last_name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasAttempted ? (
                  <>
                    <span className="font-body text-[13px] font-semibold text-success">
                      {bestAttempt.score}/{bestAttempt.total}
                    </span>
                    {bestAttempt.perfect && (
                      <span className="rounded-pill bg-success/10 px-2 py-0.5 font-body text-[11px] font-medium text-success">
                        Parfait ⭐
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                    Pas encore fait
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
