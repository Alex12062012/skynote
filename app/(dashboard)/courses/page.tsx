import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCourses } from '@/lib/supabase/queries'
import { CourseListClient } from '@/components/dashboard/CourseListClient'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { getServerLocale, createServerT } from '@/lib/i18n/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes cours' }

export default async function CoursesPage() {
  const locale = await getServerLocale()
  const t = createServerT(locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const courses = await getUserCourses(user.id)

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
        <CourseListClient courses={courses} />
      )}
    </div>
  )
}
