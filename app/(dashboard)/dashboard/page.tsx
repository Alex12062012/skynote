import Link from 'next/link'
import { Plus, ArrowRight, Flame, Zap } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getProfileWithCoins } from '@/lib/supabase/queries'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ClassroomSetup } from '@/components/classroom/ClassroomSetup'
import { ClassroomPanel } from '@/components/classroom/ClassroomPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [stats, profile] = await Promise.all([
    getDashboardStats(user.id),
    getProfileWithCoins(user.id),
  ])

  const { count: totalCourses } = await supabase
    .from('courses')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)

  const { count: totalQcm } = await supabase
    .from('qcm_attempts')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'toi'
  const coins = profile?.sky_coins ?? 0
  const streak = profile?.streak_days ?? 0
  const isPremium = profile?.plan === 'plus' || profile?.plan === 'famille'
  const isTeacher = (profile as any)?.role === 'teacher'
  const isStudent = (profile as any)?.role === 'student'

  // Données classroom pour les profs
  let classroom: any = null
  let classroomStudents: any[] = []
  if (isTeacher) {
    const { data: cls } = await supabase
      .from('classrooms')
      .select('*')
      .eq('teacher_id', user.id)
      .single()
    classroom = cls
    if (cls) {
      const { data: sts } = await supabase
        .from('classroom_students')
        .select('*')
        .eq('classroom_id', cls.id)
        .order('last_name')

      // Récupérer les profils élèves liés à cette classe
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, classroom_student_id')
        .eq('classroom_id', cls.id)
        .eq('role', 'student')

      // Récupérer les tentatives QCM de tous les élèves
      const studentIds = (studentProfiles || []).map((p: any) => p.id)
      let allAttempts: any[] = []
      if (studentIds.length > 0) {
        const { data: att } = await supabase
          .from('qcm_attempts')
          .select('user_id, score, total, perfect')
          .in('user_id', studentIds)
        allAttempts = att || []
      }

      classroomStudents = (sts || []).map((s: any) => {
        const sp = (studentProfiles || []).find(
          (p: any) => p.classroom_student_id === s.id || p.full_name === `${s.first_name} ${s.last_name}`
        )
        const userAttempts = sp ? allAttempts.filter((a: any) => a.user_id === sp.id) : []
        const best = userAttempts.reduce((b: any, a: any) => {
          if (!b || a.score / a.total > b.score / b.total) return a
          return b
        }, null)

        return {
          firstName: s.first_name,
          lastName: s.last_name,
          loginCode: s.login_code,
          qcmCount: userAttempts.length,
          bestScore: best ? `${best.score}/${best.total}` : null,
          hasPerfect: userAttempts.some((a: any) => a.perfect),
        }
      })
    }
  }

  // Pour les élèves : récupérer les cours du prof
  let teacherCourses: any[] = []
  if (isStudent && (profile as any)?.classroom_id) {
    const { data: cls } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', (profile as any).classroom_id)
      .single()
    if (cls) {
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', cls.teacher_id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(6)
      teacherCourses = courses || []
    }
  }

  // Message d'accueil selon l'heure
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* Hero */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {streak > 1
              ? `🔥 ${streak} jours de suite — continue comme ça !`
              : 'Prêt à réviser aujourd\'hui ?'}
          </p>
        </div>
        {/* Les élèves ne peuvent pas créer de cours */}
        {!isStudent && (
          <Link href="/courses/new">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="h-5 w-5" />
              Nouveau cours
            </Button>
          </Link>
        )}
      </div>

      {/* Setup classroom pour prof sans classe */}
      {isTeacher && !classroom && <ClassroomSetup />}

      {/* Panel classroom pour prof avec classe */}
      {isTeacher && classroom && (
        <ClassroomPanel classCode={classroom.class_code} students={classroomStudents} siteUrl={process.env.NEXT_PUBLIC_SITE_URL || 'https://skynote.vercel.app'} />
      )}

      {/* Cours du prof pour les élèves */}
      {isStudent && teacherCourses.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-h3 text-text-main dark:text-text-dark-main">
            Cours de la classe
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teacherCourses.map((course: any) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <StatsBar
        coursesCount={totalCourses ?? 0}
        qcmCount={totalQcm ?? 0}
        streak={streak}
        coins={coins}
      />

      {/* Bannière Premium si proche des 100 coins */}
      {!isPremium && coins >= 60 && coins < 100 && (
        <div className="flex items-center gap-4 rounded-card border border-brand/20 bg-brand-soft p-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
          <SkyCoin size={40} />
          <div className="flex-1 min-w-0">
            <p className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">
              Plus que {100 - coins} coins pour débloquer Premium ! ⭐
            </p>
            <ProgressBar value={coins} max={100} className="mt-2" />
          </div>
          <Link href="/objectives" className="flex-shrink-0">
            <Button size="sm" variant="secondary" className="gap-1">
              Voir <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Cours récents — masqué pour les élèves qui voient déjà les cours du prof au-dessus */}
      {!isStudent && (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">
            Cours récents
          </h2>
          <Link href="/courses"
            className="flex items-center gap-1 font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {stats.recentCourses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Aucun cours pour l'instant"
            description="Crée ton premier cours pour commencer à réviser avec l'IA."
            action={
              <Link href="/courses/new">
                <Button className="gap-2"><Plus className="h-4 w-4" />Créer mon premier cours</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentCourses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        )}
      </div>
      )}

      {/* Objectifs en cours */}
      <ObjectivesSummary userId={user.id} />
    </div>
  )
}

async function ObjectivesSummary({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: objectives } = await supabase.from('objectives').select('*')
  const { data: userObjectives } = await supabase
    .from('user_objectives')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)

  if (!objectives || !userObjectives || userObjectives.length === 0) return null

  const inProgress = userObjectives
    .map((uo: any) => {
      const obj = objectives.find((o: any) => o.id === uo.objective_id)
      if (!obj) return null
      return { ...obj, current: uo.current_value }
    })
    .filter(Boolean)
    .slice(0, 3)

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
