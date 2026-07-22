import Link from 'next/link'
import { Plus, ArrowRight, GraduationCap } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getProfileWithCoins } from '@/lib/supabase/queries'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Reveal } from '@/components/ui/Reveal'
import { PseudoModal } from '@/components/leaderboard/PseudoModal'
import { getServerLocale, createServerT } from '@/lib/i18n/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function DashboardPage() {
  const locale = await getServerLocale()
  const t = createServerT(locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [stats, profile] = await Promise.all([
    getDashboardStats(user.id),
    getProfileWithCoins(user.id),
  ])

  const [{ count: totalCourses }, { count: totalQcm }] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('qcm_attempts').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'toi'
  const coins = profile?.sky_coins ?? 0
  const streak = profile?.streak_days ?? 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('dash.goodMorning') : hour < 18 ? t('dash.goodAfternoon') : t('dash.goodEvening')

  // Pseudo requis pour le top 100
  const { data: top100Check } = await supabase
    .from('profiles')
    .select('id')
    .order('sky_coins', { ascending: false })
    .limit(100)
  const isInTop100 = (top100Check || []).some((p: any) => p.id === user.id)
  const needsPseudo = isInTop100 && !profile?.pseudo

  const hasNoCourses = stats.recentCourses.length === 0

  return (
    <div className="flex flex-col gap-8">
      <Reveal i={0} inView={false} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {streak > 1 ? t('dash.streakMsg').replace('{n}', String(streak)) : t('dash.readyToStudy')}
          </p>
        </div>
        <Link href="/courses/new">
          <Button size="lg" variant="primary" className="gap-2 w-full sm:w-auto shadow-none hover:shadow-none hover:translate-y-0">
            <Plus className="h-5 w-5" />{t('dash.newCourse')}
          </Button>
        </Link>
      </Reveal>

      {needsPseudo && <PseudoModal userId={user.id} />}

      <Reveal i={1} inView={false}>
        <StatsBar coursesCount={totalCourses ?? 0} qcmCount={totalQcm ?? 0} streak={streak} coins={coins} />
      </Reveal>

      {/* Mini-Épreuve Brevet — bannière pleine largeur, look landing */}
      <Reveal i={2} inView={false} className="relative">
        <Link href="/brevet"
          className="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-card border border-brand-dark/30 bg-gradient-to-br from-brand/25 via-night-surface to-night-surface px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-brand-dark/50 hover:shadow-[0_18px_50px_-30px_rgba(37,99,235,0.8)]">
          <span className="cta-sheen" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-input bg-brand text-white shadow-[0_6px_18px_-6px_rgba(37,99,235,0.8)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-[15px] font-bold text-brand-dark">
                Mini-Épreuve Brevet
              </p>
              <p className="font-body text-[12px] text-text-dark-secondary">
                Simulation basée sur les vraies annales · Gratuit · Résultats dès Starter
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 flex-shrink-0 text-brand-dark transition-transform group-hover:translate-x-1" />
        </Link>
        <span className="absolute -top-2 left-14 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none pointer-events-none select-none">
          NEW
        </span>
      </Reveal>

      <Reveal i={3} inView={false}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">{t('dash.recentCourses')}</h2>
          <Link href="/courses" className="flex items-center gap-1 font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            {t('dash.viewAll')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {stats.recentCourses.length === 0 ? (
          <EmptyState icon="book" title={t('dash.noCourses')}
            description={t('dash.noCoursesDesc')}
            action={<Link href="/courses/new"><Button className="gap-2"><Plus className="h-4 w-4" />{t('dash.createFirst')}</Button></Link>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentCourses.map((course) => <CourseCard key={course.id} {...course} />)}
          </div>
        )}
      </Reveal>

      <ObjectivesSummary userId={user.id} />
    </div>
  )
}

async function ObjectivesSummary({ userId }: { userId: string }) {
  const locale = await getServerLocale()
  const t = createServerT(locale)
  const supabase = await createClient()
  const { data: objectives } = await supabase.from('objectives').select('*')
  const { data: userObjectives } = await supabase
    .from('user_objectives').select('*').eq('user_id', userId).eq('completed', false)

  if (!objectives || !userObjectives || userObjectives.length === 0) return null

  const inProgress = userObjectives
    .map((uo: any) => {
      const obj = objectives.find((o: any) => o.id === uo.objective_id)
      if (!obj) return null
      return { ...obj, current: uo.current_value }
    })
    .filter(Boolean).slice(0, 3)

  if (inProgress.length === 0) return null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">{t('dash.objectivesInProgress')}</h2>
        <Link href="/objectives" className="flex items-center gap-1 font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
          {t('dash.viewAll')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {inProgress.map((obj: any) => (
          <div key={obj.id} className="flex items-start gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
            <span className="text-2xl flex-shrink-0">{obj.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[13px] font-semibold text-text-main dark:text-text-dark-main truncate">{obj.title}</p>
              <div className="mt-1.5 space-y-1">
                <ProgressBar value={obj.current} max={obj.target_value} />
                <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                  {obj.current}/{obj.target_value} · <span className="text-brand dark:text-brand-dark">+{obj.reward_coins} coins</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
