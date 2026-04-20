import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateCourseForm } from '@/components/courses/CreateCourseForm'
import type { Metadata } from 'next'
import { getServerLocale, createServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Nouveau cours' }

interface Props { searchParams: Promise<{ folder?: string; classroom?: string }> }

export default async function NewCoursePage({ searchParams }: Props) {
  const locale = await getServerLocale()
  const t = createServerT(locale)

  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'student') redirect('/dashboard')

  const isTeacher = profile?.role === 'teacher'

  // Si un folder est passe, recuperer son nom pour l'afficher
  let folderName = ''
  if (params.folder) {
    const { data: folder } = await supabase.from('course_folders').select('name').eq('id', params.folder).single()
    folderName = folder?.name || ''
  }

  // Si prof, recuperer tous ses dossiers
  let teacherFolders: { id: string; name: string; color: string; classroom_id: string }[] = []
  if (isTeacher) {
    const { data: folders } = await supabase
      .from('course_folders')
      .select('id, name, color, classroom_id')
      .eq('created_by', user.id)
      .order('order_index', { ascending: true })
    teacherFolders = folders || []
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <Link href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {folderName ? t('newCourse.backToFolder').replace('{folder}', folderName) : t('newCourse.back')}
      </Link>
      <div className="mb-8">
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">{t('newCourse.title')}</h1>
        <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
          {folderName
            ? t('newCourse.courseInFolder').replace('{folder}', folderName)
            : isTeacher
              ? t('newCourse.teacherSubtitle')
              : t('newCourse.subtitle')}
        </p>
      </div>
      <div className="rounded-card-login bg-sky-surface p-6 shadow-card dark:bg-night-surface dark:shadow-card-dark">
        <CreateCourseForm
          folderId={params.folder}
          classroomId={params.classroom}
          isTeacher={isTeacher}
          teacherFolders={teacherFolders}
        />
      </div>
    </div>
  )
}
