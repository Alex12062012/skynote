import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getUserPlanLimits } from '@/lib/supabase/plan'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateCourseForm } from '@/components/courses/CreateCourseForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouveau cours' }

export default async function NewCoursePage() {
  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <Link href="/courses"
        className="mb-6 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Mes cours
      </Link>
      <div className="mb-8">
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
          Nouveau cours
        </h1>
        <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
          L'IA génère tes fiches de révision et ton QCM automatiquement ✨
        </p>
      </div>
      <div className="rounded-card-login bg-sky-surface p-6 shadow-card dark:bg-night-surface dark:shadow-card-dark">
        <CreateCourseForm />
      </div>
    </div>
  )
}
