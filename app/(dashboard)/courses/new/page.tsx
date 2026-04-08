import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateCourseForm } from '@/components/courses/CreateCourseForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouveau cours' }

interface Props { searchParams: Promise<{ folder?: string; classroom?: string }> }

export default async function NewCoursePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'student') redirect('/dashboard')

  // Si un folder est passe, recuperer son nom pour l'afficher
  let folderName = ''
  if (params.folder) {
    const { data: folder } = await supabase.from('course_folders').select('name').eq('id', params.folder).single()
    folderName = folder?.name || ''
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <Link href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {folderName ? `Retour a ${folderName}` : 'Mes cours'}
      </Link>
      <div className="mb-8">
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Nouveau cours</h1>
        <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
          {folderName ? `Cours dans le dossier ${folderName}` : "L'IA genere tes fiches de revision et ton QCM automatiquement"}
        </p>
      </div>
      <div className="rounded-card-login bg-sky-surface p-6 shadow-card dark:bg-night-surface dark:shadow-card-dark">
        <CreateCourseForm folderId={params.folder} classroomId={params.classroom} />
      </div>
    </div>
  )
}