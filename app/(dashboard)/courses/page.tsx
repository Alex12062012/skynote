import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCourses, getTeacherCourses } from '@/lib/supabase/queries'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubjectBadge } from '@/components/ui/Badge'
import { StudentCourseFolders } from '@/components/courses/StudentCourseFolders'
import type { Metadata } from 'next'
import type { Course } from '@/types/database'

export const metadata: Metadata = { title: 'Mes cours' }

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isStudent = profile?.role === 'student'

  const courses = isStudent
    ? await getTeacherCourses(user.id)
    : await getUserCourses(user.id)

  // ── STUDENT VIEW: subject folders with new-course badge ──
  if (isStudent) {
    // Get student's QCM attempts to determine "done" courses
    const courseIds = courses.map((c) => c.id)
    let attemptedCourseIds = new Set<string>()

    if (courseIds.length > 0) {
      // Get flashcard→course mapping for attempted flashcards
      const { data: attempts } = await supabase
        .from('qcm_attempts')
        .select('flashcard_id')
        .eq('user_id', user.id)

      if (attempts && attempts.length > 0) {
        const flashcardIds = [...new Set(attempts.map((a: any) => a.flashcard_id))]
        const { data: flashcards } = await supabase
          .from('flashcards')
          .select('id, course_id')
          .in('id', flashcardIds)
          .in('course_id', courseIds)

        if (flashcards) {
          for (const f of flashcards) {
            attemptedCourseIds.add(f.course_id)
          }
        }
      }
    }

    const now = Date.now()
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

    // Enrich courses with "new" and "done" flags
    const enrichedCourses = courses.map((c) => ({
      ...c,
      isNew: (now - new Date(c.created_at).getTime()) < ONE_WEEK_MS,
      isDone: attemptedCourseIds.has(c.id),
    }))

    // Group by subject
    const grouped = enrichedCourses.reduce<Record<string, typeof enrichedCourses>>((acc, c) => {
      if (!acc[c.subject]) acc[c.subject] = []
      acc[c.subject].push(c)
      return acc
    }, {})

    // Sort subjects: those with "new" courses first, then alphabetically
    const sortedSubjects = Object.entries(grouped).sort(([subA, coursesA], [subB, coursesB]) => {
      const aHasNew = coursesA.some((c) => c.isNew)
      const bHasNew = coursesB.some((c) => c.isNew)
      if (aHasNew && !bHasNew) return -1
      if (!aHasNew && bHasNew) return 1
      return subA.localeCompare(subB)
    })

    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            Cours de la classe
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            {courses.length} cours
          </p>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Aucun cours pour l'instant"
            description="Ton professeur n'a pas encore ajouté de cours."
          />
        ) : (
          <StudentCourseFolders subjects={sortedSubjects} />
        )}
      </div>
    )
  }

  // ── TEACHER / NORMAL USER VIEW: grouped by subject ──
  // Sort: subjects with more courses at the top
  const grouped = courses.reduce<Record<string, Course[]>>((acc, c) => {
    if (!acc[c.subject]) acc[c.subject] = []
    acc[c.subject].push(c)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            Mes cours
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            {courses.length} cours
          </p>
        </div>
        <Link href="/courses/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Nouveau cours</Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState icon="📚" title="Aucun cours pour l'instant"
          description="Crée ton premier cours pour que l'IA génère tes fiches de révision."
          action={<Link href="/courses/new"><Button className="gap-2"><Plus className="h-4 w-4" />Créer mon premier cours</Button></Link>}
        />
      ) : (
        Object.entries(grouped).map(([subject, subjectCourses]) => (
          <div key={subject}>
            <div className="mb-4 flex items-center gap-3">
              <SubjectBadge subject={subject} />
              <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                {subjectCourses.length} cours
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjectCourses.map((c) => <CourseCard key={c.id} {...c} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
