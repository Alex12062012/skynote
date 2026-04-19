import Link from 'next/link'
import { Plus, ArrowRight, Flame, BookOpen } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getDashboardStats, getProfileWithCoins } from '@/lib/supabase/queries'
import { getActiveEvaluations } from '@/lib/supabase/eval-actions'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { EvalBanner } from '@/components/dashboard/EvalBanner'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PseudoModal } from '@/components/leaderboard/PseudoModal'
import { ClassroomSetup } from '@/components/classroom/ClassroomSetup'
import { TeacherDashboardClient } from '@/components/classroom/TeacherDashboardClient'
import { StudentCourseFolders } from '@/components/courses/StudentCourseFolders'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const activeTab = tab === 'classCode' || tab === 'payment' ? tab : 'courses'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [stats, profile, activeEvals] = await Promise.all([
    getDashboardStats(user.id),
    getProfileWithCoins(user.id),
    getActiveEvaluations(),
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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir'

  // ============================================
  // DASHBOARD PROFESSEUR
  // ============================================
  if (isTeacher) {
    // Client admin pour bypasser la RLS sur toutes les données classroom
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: cls } = await admin
      .from('classrooms')
      .select('*')
      .eq('teacher_id', user.id)
      .single()

    if (!cls) {
      return (
        <div className="flex flex-col gap-8 animate-fade-in">
          <div>
            <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
              Creez votre classe pour commencer
            </p>
          </div>
          <ClassroomSetup />
        </div>
      )
    }

    // S'assurer que le créateur est dans classroom_teachers (fix comptes existants)
    await admin.from('classroom_teachers').upsert({
      classroom_id: cls.id,
      teacher_id: user.id,
      role: 'owner',
    }, { onConflict: 'classroom_id,teacher_id' })

    // Dossiers matières par défaut
    const DEFAULT_FOLDERS = [
      { name: 'Francais',              color: '#DC2626' },
      { name: 'Mathematiques',         color: '#2563EB' },
      { name: 'Histoire-Geographie',   color: '#D97706' },
      { name: 'Anglais',               color: '#0891B2' },
      { name: 'Sciences (SVT)',        color: '#059669' },
      { name: 'Physique-Chimie',       color: '#7C3AED' },
    ]

    // Recuperer les dossiers existants
    let { data: folders } = await admin
      .from('course_folders')
      .select('*')
      .eq('classroom_id', cls.id)
      .order('order_index')

    // Ajouter uniquement les dossiers par défaut qui n'existent pas encore
    const existingNames = new Set((folders || []).map((f: any) => f.name))
    const missingFolders = DEFAULT_FOLDERS.filter(f => !existingNames.has(f.name))

    if (missingFolders.length > 0) {
      const maxIndex = folders && folders.length > 0
        ? Math.max(...folders.map((f: any) => f.order_index ?? 0)) + 1
        : 0
      await admin.from('course_folders').insert(
        missingFolders.map((f, i) => ({
          classroom_id: cls.id,
          name: f.name,
          color: f.color,
          is_default: true,
          created_by: user.id,
          order_index: maxIndex + i,
        }))
      )
      const { data: newFolders } = await admin
        .from('course_folders')
        .select('*')
        .eq('classroom_id', cls.id)
        .order('order_index')
      folders = newFolders
    }

    const { data: classroomCourses } = await admin
      .from('courses')
      .select('id, folder_id')
      .eq('classroom_id', cls.id)

    const foldersWithCount = (folders || []).map((f: any) => ({
      ...f,
      courseCount: (classroomCourses || []).filter((c: any) => c.folder_id === f.id).length,
    })).sort((a: any, b: any) => b.courseCount - a.courseCount)

    // Recuperer les eleves
    const { data: classStudents } = await admin
      .from('classroom_students')
      .select('*')
      .eq('classroom_id', cls.id)
      .order('last_name')

    // Recuperer les profs de la classe
    const { data: classTeachers } = await admin
      .from('classroom_teachers')
      .select('*, profiles(full_name, email)')
      .eq('classroom_id', cls.id)

    // Settings
    const { data: settings } = await admin
      .from('classroom_settings')
      .select('*')
      .eq('classroom_id', cls.id)
      .single()

    // Recuperer tous les cours de la classe
    const { data: allCourses } = await admin
      .from('courses')
      .select('*')
      .eq('classroom_id', cls.id)
      .order('created_at', { ascending: false })

    // Compter les flashcards par cours (= nombre de QCM)
    const courseIds = (allCourses || []).map((c: any) => c.id)
    let flashcardsByCourse: Record<string, number> = {}
    if (courseIds.length > 0) {
      const { data: flashcards } = await admin
        .from('flashcards')
        .select('id, course_id')
        .in('course_id', courseIds)
      for (const f of (flashcards || [])) {
        flashcardsByCourse[f.course_id] = (flashcardsByCourse[f.course_id] || 0) + 1
      }
    }

    // Recuperer les profils eleves lies
    const { data: studentProfiles } = await admin
      .from('profiles')
      .select('id, full_name, classroom_student_id')
      .eq('classroom_id', cls.id)
      .eq('role', 'student')

    // Recuperer toutes les tentatives QCM des eleves
    const studentProfileIds = (studentProfiles || []).map((p: any) => p.id)
    let attemptsByStudent: Record<string, any[]> = {}
    if (studentProfileIds.length > 0) {
      const { data: attempts } = await admin
        .from('qcm_attempts')
        .select('user_id, flashcard_id, score, total, perfect, created_at')
        .in('user_id', studentProfileIds)
      for (const a of (attempts || [])) {
        if (!attemptsByStudent[a.user_id]) attemptsByStudent[a.user_id] = []
        attemptsByStudent[a.user_id].push(a)
      }
    }

    // Mapper student_id (classroom_students) vers profile_id
    const studentDataWithProfileId = (classStudents || []).map((s: any) => {
      const sp = (studentProfiles || []).find(
        (p: any) => p.classroom_student_id === s.id || p.full_name === s.first_name + ' ' + s.last_name
      )
      return { ...s, profile_id: sp?.id || null }
    })

    // Ajouter course_id aux attempts via flashcard lookup
    const { data: allFlashcards } = await admin
      .from('flashcards')
      .select('id, course_id')
      .in('course_id', courseIds)

    const flashcardToCourse: Record<string, string> = {}
    for (const f of (allFlashcards || [])) {
      flashcardToCourse[f.id] = f.course_id
    }

    // Enrichir attempts avec course_id
    const enrichedAttempts: Record<string, any[]> = {}
    for (const s of studentDataWithProfileId) {
      if (!s.profile_id) continue
      const attempts = attemptsByStudent[s.profile_id] || []
      enrichedAttempts[s.id] = attempts.map((a: any) => ({
        ...a,
        course_id: flashcardToCourse[a.flashcard_id] || null,
      }))
    }

    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {(classStudents || []).length} eleves dans votre classe
          </p>
        </div>
        <TeacherDashboardClient
          classroom={cls}
          folders={foldersWithCount}
          students={classStudents || []}
          teachers={classTeachers || []}
          settings={settings}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL || 'https://skynote.fr'}
          courses={allCourses || []}
          flashcardsByCourse={flashcardsByCourse}
          attemptsByStudent={enrichedAttempts}
          activeTab={activeTab}
          teacherUserNumber={(profile as any)?.user_number ?? null}
        />
      </div>
    )
  }

  // ============================================
  // DASHBOARD ELEVE
  // ============================================
  if (isStudent) {
    const classroomId = (profile as any)?.classroom_id
    let teacherCourses: any[] = []
    let classFolders: any[] = []

    if (classroomId) {
      const [foldersRes, coursesRes] = await Promise.all([
        supabase.from('course_folders').select('id, name, color, order_index').eq('classroom_id', classroomId).order('order_index'),
        supabase.from('courses').select('*, folder_id').eq('classroom_id', classroomId).eq('status', 'ready').order('created_at', { ascending: false }),
      ])
      classFolders = foldersRes.data || []
      teacherCourses = coursesRes.data || []
    }

    const now = Date.now()
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
    const folderMap = new Map(classFolders.map((f: any) => [f.id, f]))

    // Build folder list with their courses (only folders that have courses)
    const foldersWithCourses = classFolders
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        courses: teacherCourses
          .filter((c: any) => c.folder_id === f.id)
          .map((c: any) => ({
            ...c,
            isNew: (now - new Date(c.created_at).getTime()) < ONE_WEEK_MS,
            isDone: false,
          })),
      }))
      .filter((f: any) => f.courses.length > 0)

    // Courses without a folder
    const coursesWithoutFolder = teacherCourses.filter(
      (c: any) => !c.folder_id || !folderMap.has(c.folder_id)
    )
    if (coursesWithoutFolder.length > 0) {
      foldersWithCourses.push({
        id: '__other__',
        name: 'Autres cours',
        color: '#64748B',
        courses: coursesWithoutFolder.map((c: any) => ({
          ...c,
          isNew: (now - new Date(c.created_at).getTime()) < ONE_WEEK_MS,
          isDone: false,
        })),
      })
    }

    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {streak > 1 ? `${streak} jours de suite !` : 'Pret a reviser ?'}
          </p>
        </div>

        <StatsBar coursesCount={totalCourses ?? 0} qcmCount={totalQcm ?? 0} streak={streak} coins={coins} />

        <div className="flex flex-col gap-4">
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">Cours de la classe</h2>
          {foldersWithCourses.length === 0 ? (
            <EmptyState icon={<BookOpen className="h-10 w-10 text-text-tertiary dark:text-text-dark-tertiary" />} title="Aucun cours" description="Ton professeur n'a pas encore ajouté de cours." />
          ) : (
            <StudentCourseFolders folders={foldersWithCourses} />
          )}
        </div>

        <ObjectivesSummary userId={user.id} />
      </div>
    )
  }

  // ============================================
  // DASHBOARD UTILISATEUR NORMAL
  // ============================================

  // Vérifier si l'utilisateur est dans le top 100 sans pseudo
  const { data: top100Check } = await supabase
    .from('profiles')
    .select('id')
    .order('sky_coins', { ascending: false })
    .limit(100)
  const isInTop100 = (top100Check || []).some((p: any) => p.id === user.id)
  const needsPseudo = isInTop100 && !profile?.pseudo

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">
            {streak > 1 ? `${streak} jours de suite !` : 'Pret a reviser ?'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/eval/new">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="h-5 w-5" />Nouvelle éval
            </Button>
          </Link>
          <Link href="/courses/new">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="h-5 w-5" />Nouveau cours
            </Button>
          </Link>
        </div>
      </div>

      {needsPseudo && (
        <PseudoModal userId={user.id} />
      )}

      <StatsBar coursesCount={totalCourses ?? 0} qcmCount={totalQcm ?? 0} streak={streak} coins={coins} />

      <EvalBanner evals={activeEvals} />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">Cours recents</h2>
          <Link href="/courses" className="flex items-center gap-1 font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {stats.recentCourses.length === 0 ? (
          <EmptyState icon="\uD83D\uDCDA" title="Aucun cours"
            description="Cree ton premier cours pour reviser avec l'IA."
            action={<Link href="/courses/new"><Button className="gap-2"><Plus className="h-4 w-4" />Creer mon premier cours</Button></Link>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentCourses.map((course) => (<CourseCard key={course.id} {...course} />))}
          </div>
        )}
      </div>

      <ObjectivesSummary userId={user.id} />
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
