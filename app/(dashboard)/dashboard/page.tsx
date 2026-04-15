import Link from 'next/link'
import { Plus, ArrowRight, BookOpen } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCourses } from '@/lib/supabase/queries'
import { getProfileWithCoins } from '@/lib/supabase/queries'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Accueil — Skynote' }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const activeTab = tab === 'classCode' || tab === 'payment' ? tab : 'courses'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, courses] = await Promise.all([
    getProfileWithCoins(user.id),
    getUserCourses(user.id),
  ])

  const [{ count: qcmCount }] = await Promise.all([
    supabase
      .from('qcm_attempts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id),
  ])

  const firstName = profile?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'toi'

  const coins = profile?.sky_coins ?? 0
  const streak = profile?.streak_days ?? 0
  const readyCourses = courses.filter((c) => c.status === 'ready')
  const recentCourses = courses.slice(0, 6)

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* Salutation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            Bonjour, {firstName} 👋
          </h1>
          <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            {readyCourses.length === 0
              ? 'Crée ton premier cours pour commencer à réviser.'
              : `Tu as ${readyCourses.length} cours prêt${readyCourses.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <Link href="/courses/new">
          <Button className="gap-2 flex-shrink-0">
            <Plus className="h-4 w-4" />
            Nouveau cours
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsBar
        coursesCount={readyCourses.length}
        qcmCount={qcmCount ?? 0}
        streak={streak}
        coins={coins}
      />

      {/* Cours récents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">
            Cours récents
          </h2>
          {courses.length > 6 && (
            <Link
              href="/courses"
              className="flex items-center gap-1 font-body text-[13px] text-brand hover:underline dark:text-brand-dark"
            >
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon="📚"
   