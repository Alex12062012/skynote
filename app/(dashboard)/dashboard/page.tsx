import Link from 'next/link'
import { Plus, ArrowRight, BookOpen, Zap } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getProfileWithCoins } from '@/lib/supabase/queries'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PseudoModal } from '@/components/leaderboard/PseudoModal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord' }

// Cours démo statique — montré quand l'utilisateur n'a aucun cours
const DEMO_COURSE = {
  id: '__demo__',
  title: 'La Révolution française',
  subject: 'Histoire',
  color: '#2563EB',
  status: 'ready' as const,
  progress: 45,
  created_at: new Date().toISOString(),
  source_type: 'text' as const,
}

export default async function DashboardPage() {
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
  const isPremium = profile?.plan === 'plus' || profile?.plan === 'famille'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // Pseudo requis si dans le top 100
  const { data: top100Check } = await supabase
    .from('profiles')
    .select('id')
    .order('sky_coins', { ascending: false })
    .limit(100)
  const isInTop100 = (top100Check || []).some((p: any) => p.id === user.id)
  const needsPseudo = isInTop100 && !profile?.pseudo

  const hasNoCourses = stats.recentCourses.length === 0

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {streak > 1 ? `🔥 ${streak} jours de suite !` : 'Prêt à réviser ?'}
          </p>
        </div>
        <Link href="/courses/new">
          <Button size="lg" className="gap-2 w-full sm:w-auto">
            <Plus className="h-5 w-5" />Nouveau cours
          </Button>
        </Link>
      </div>

      {needsPseudo && <PseudoModal userId={user.id} />}

      <StatsBar coursesCount={totalCourses ?? 0} qcmCount={totalQcm ?? 0} streak={streak} coins={coins} />

      {!isPremium && coins >= 60 && coins < 100 && (
        <div className="flex items-center gap-4 rounded-card border border-brand/20 bg-brand-soft p-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
          <SkyCoin size={40} />
          <div className="flex-1 min-w-0">
            <p className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">
              Plus que {100 - coins} coins pour Premium !
            </p>
            <ProgressBar value={coins} max={100} className="mt-2" />
          </div>
          <Link href="/objectives" className="flex-shrink-0">
            <Button size="sm" variant="secondary" className="gap-1">Voir <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">
            {hasNoCourses ? 'Exemple de cours' : 'Cours récents'}
          </h2>
          {!hasNoCourses && (
            <Link href="/courses" className="flex items-center gap-1 font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {hasNoCourses ? (
          <DemoCourseSection />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentCourses.map((course) => <CourseCard key={course.id} {...course} />)}
          </div>
        )}
      </div>

      <ObjectivesSummary userId={user.id} />
    </div>
  )
}

function DemoCourseSection() {
  return (
    <div className="flex flex-col gap-4">
      {/* Bandeau d'intro */}
      <div className="flex items-start gap-3 rounded-card border border-brand/20 bg-brand-soft px-4 py-3 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
        <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand dark:text-brand-dark" />
        <p className="font-body text-[13px] text-brand dark:text-brand-dark">
          Voici à quoi ressemble un cours généré par l'IA. Importe n'importe quel texte pour obtenir le tien en 30 secondes.
        </p>
      </div>

      {/* Carte démo (non cliquable — lien vers /courses/new) */}
      <div className="relative">
        <div className="group flex flex-col gap-3 rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark opacity-80">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-pill bg-blue-100 px-2.5 py-0.5 font-body text-[11px] font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                  Histoire
                </span>
                <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">📝</span>
              </div>
              <h3 className="font-display text-[16px] font-semibold text-text-main dark:text-text-dark-main">
                La Révolution française
              </h3>
            </div>
            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-success" />
          </div>
          <div className="space-y-1">
            <ProgressBar value={45} />
            <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">45% maîtrisé</p>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-3 w-3 text-text-tertiary dark:text-text-dark-tertiary" />
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">6 fiches · 24 questions QCM</p>
          </div>
        </div>

        {/* Badge DEMO */}
        <span className="absolute right-3 top-3 rounded-pill bg-amber-100 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          Démo
        </span>
      </div>

      {/* CTA */}
      <Link href="/courses/new" className="w-full sm:w-auto">
        <Button className="w-full gap-2 sm:w-auto" size="lg">
          <Plus className="h-5 w-5" />Créer mon premier cours
        </Button>
      </Link>
    </div>
  )
}

async function ObjectivesSummary({ userId }: { userId: string }) {
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
        <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">Objectifs en cours</h2>
        <Link href="/objectives" className="flex items-center gap-1 font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
          Voir tout <ArrowRight className="h-4 w-4" />
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
