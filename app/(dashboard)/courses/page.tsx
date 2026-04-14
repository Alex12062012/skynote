import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCourses } from '@/lib/supabase/queries'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubjectBadge } from '@/components/ui/Badge'
import type { Metadata } from 'next'
import type { Course } from '@/types/database'

export const metadata: Metadata = { title: 'Mes cours' }

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, classroom_id').eq('id', user.id).single()
  const isStudent = profile?.role === 'student'

  // ── STUDENT VIEW ──
  if (isStudent) {
    const classroomId = (profile as any)?.classroom_id
    let classFolders: any[] = []
    let teacherCourses: any[] = []

    if (classroomId) {
      const [foldersRes, coursesRes] = await Promise.all([
        supabase.from('course_folders').select('id, name, color, order_index').eq('classroom_id', classroomId).order('order_index'),
        supabase.from('courses').select('*, folder_id').eq('classroom_id', classroomId).eq('status', 'ready').order('created_at', { ascending: false }),
      ])
      classFolders = foldersRes.data || []
      teacherCourses = coursesRes.data || []
    }

    // Group courses by folder name (same layout as normal users but with folder name)
    const folderMap = new Map(classFolders.map((f: any) => [f.id, f]))
    const grouped: Record<string, any[]> = {}
    for (const course of teacherCourses) {
      const folder = folderMap.get(course.folder_id)
      const key = folder?.name ?? 'Autres'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(course)
    }

    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Cours de la classe</h1>
          <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            {teacherCourses.length} cours
          </p>
        </div>

        {teacherCourses.length === 0 ? (
          <EmptyState  title="Aucun cours pour l'instant" description="Ton professeur n'a pas encore ajouté de cours." />
        ) : (
          Object.entries(grouped).map(([folderName, courses]) => (
            <div key={folderName}>
              <div className="mb-4 flex items-center gap-3">
                <SubjectBadge subject={folderName} />
                <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                  {courses.length} cours
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c: any) => <CourseCard key={c.id} {...c} />)}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  // ── NORMAL USER / TEACHER VIEW ──
  const courses = await getUserCourses(user.id)
  const grouped = courses.reduce<Record<string, Course[]>>((acc, c) => {
    if (!acc[c.subject]) acc[c.subject] = []
    acc[c.subject].push(c)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Mes cours</h1>
          <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">{courses.length} cours</p>
        </div>
        <Link href="/courses/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Nouveau cours</Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState  title="Aucun cours pour l'instant"
          description="Crée ton premier cours pour que l'IA génère tes fiches de révision."
          action={<Link href="/courses/new"><Button className="gap-2"><Plus className="h-4 w-4" />Créer mon premier cours</Button></Link>}
        />
      ) : (
        Object.entries(grouped).map(([subject, subjectCourses]) => (
          <div key={subject}>
            <div className="mb-4 flex items-center gap-3">
              <SubjectBadge subject={subject} />
              <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">{subjectCourses.length} cours</span>
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
