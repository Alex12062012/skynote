import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCourses } from '@/lib/supabase/queries'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubjectBadge } from '@/components/ui/Badge'
import { getServerLocale, createServerT } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import type { Course } from '@/types/database'

export const metadata: Metadata = { title: 'Mes cours' }

export default async function CoursesPage() {
  const locale = await getServerLocale()
  const t = createServerT(locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">{t('courses.myCourses')}</h1>
          <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            {t('courses.nCourses').replace('{n}', String(courses.length))}
          </p>
        </div>
        <Link href="/courses/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />{t('dash.newCourse')}</Button>
        </Link>
      </div>
      {courses.length === 0 ? (
        <EmptyState
          title={t('courses.noCoursesTitle')}
          description={t('courses.noCoursesDesc')}
          action={<Link href="/courses/new"><Button className="gap-2"><Plus className="h-4 w-4" />{t('courses.createFirst')}</Button></Link>}
        />
      ) : (
        Object.entries(grouped).map(([subject, subjectCourses]) => (
          <div key={subject}>
            <div className="mb-4 flex items-center gap-3">
              <SubjectBadge subject={subject} />
              <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                {t('courses.nCourses').replace('{n}', String(subjectCourses.length))}
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
