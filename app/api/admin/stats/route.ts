import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

async function verifyAdmin(): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isAdmin: false, error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) }
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return { isAdmin: false, error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }
  return { isAdmin: true }
}

function getDaysArray(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return d.toISOString().split('T')[0]
  })
}

function buildTimeSeries(days: string[], data: any[], dateField: string): { date: string; count: number }[] {
  const map: Record<string, number> = {}
  days.forEach(d => { map[d] = 0 })
  ;(data || []).forEach((row: any) => {
    const day = row[dateField]?.split('T')[0]
    if (day && day in map) map[day]++
  })
  return days.map(date => ({ date, count: map[date] }))
}

export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin()
  if (!isAdmin) return error!

  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7'

    const daysCount = period === 'all' ? 365 : parseInt(period)
    const days = getDaysArray(daysCount)
    const since = new Date()
    since.setDate(since.getDate() - daysCount)
    const sinceISO = since.toISOString()

    const [
      { count: totalUsers },
      { count: totalCourses },
      { count: totalQcm },
      { count: perfectQcm },
      { count: totalFlashcards },
      { data: recentUsers },
      { data: topUsers },
      { data: allSignups },
      { data: allQcm },
      { data: allCourses },
      { data: coinTransactions },
      { data: allQcmForAvg },
      { data: allTimeSignups },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }).eq('perfect', true),
      supabase.from('flashcards').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('id,email,full_name,sky_coins,plan,streak_days,created_at,last_login_at,is_beta_tester').order('created_at', { ascending: false, nullsFirst: false }).limit(1000),
      supabase.from('profiles').select('id,email,full_name,sky_coins,plan,streak_days').neq('role', 'teacher').order('sky_coins', { ascending: false }).limit(10),
      supabase.from('profiles').select('created_at').gte('created_at', sinceISO),
      supabase.from('qcm_attempts').select('created_at').gte('created_at', sinceISO),
      supabase.from('courses').select('created_at').gte('created_at', sinceISO),
      supabase.from('coin_transactions').select('amount,created_at').gte('created_at', sinceISO),
      supabase.from('qcm_attempts').select('user_id,created_at').gte('created_at', sinceISO),
      supabase.from('profiles').select('created_at').order('created_at', { ascending: true }),
    ])

    const signupsSeries = buildTimeSeries(days, allSignups || [], 'created_at')
    const qcmSeries = buildTimeSeries(days, allQcm || [], 'created_at')
    const coursesSeries = buildTimeSeries(days, allCourses || [], 'created_at')

    const coinsMap: Record<string, number> = {}
    days.forEach(d => { coinsMap[d] = 0 })
    ;(coinTransactions || []).forEach((tx: any) => {
      const day = tx.created_at?.split('T')[0]
      if (day && day in coinsMap && tx.amount > 0) coinsMap[day] += tx.amount
    })
    const coinsSeries = days.map(date => ({ date, count: coinsMap[date] }))

    const qcmPerUserMap: Record<string, Set<string>> = {}
    days.forEach(d => { qcmPerUserMap[d] = new Set() })
    const qcmCountMap: Record<string, number> = {}
    days.forEach(d => { qcmCountMap[d] = 0 })
    ;(allQcmForAvg || []).forEach((q: any) => {
      const day = q.created_at?.split('T')[0]
      if (day && day in qcmPerUserMap) {
        qcmPerUserMap[day].add(q.user_id)
        qcmCountMap[day]++
      }
    })
    const avgQcmSeries = days.map(date => ({
      date,
      count: qcmPerUserMap[date].size > 0
        ? Math.round((qcmCountMap[date] / qcmPerUserMap[date].size) * 10) / 10
        : 0,
    }))

    const estimatedApiCost = totalCourses
      ? (((totalCourses * 2000) / 1_000_000) * 3 + ((totalCourses * 1500) / 1_000_000) * 15).toFixed(2)
      : '0.00'

    const totalCoinsDistributed = (coinTransactions || [])
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const avgQcmPerUser = totalUsers && totalQcm
      ? ((totalQcm ?? 0) / totalUsers).toFixed(1)
      : '0'

    const [
      { data: activeUsersToday },
      { data: usersWithCourses },
      { data: usersWithQcm },
      { data: usersWithPerfect },
      { data: premiumUsers },
      { data: streakUsers },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, last_login_at, plan, sky_coins').gte('last_login_at', sinceISO).order('last_login_at', { ascending: false }),
      supabase.from('courses').select('user_id, profiles(full_name, email, plan)').gte('created_at', sinceISO),
      supabase.from('qcm_attempts').select('user_id, profiles(full_name, email, plan)').gte('created_at', sinceISO),
      supabase.from('qcm_attempts').select('user_id, profiles(full_name, email, plan)').eq('perfect', true).gte('created_at', sinceISO),
      supabase.from('profiles').select('id, full_name, email, plan, sky_coins, last_login_at').in('plan', ['plus', 'famille']).order('sky_coins', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email, streak_days, plan').gte('streak_days', 3).order('streak_days', { ascending: false }),
    ])

    // Série cumulative all-time (total utilisateurs depuis le début)
    const dailyCounts: Record<string, number> = {}
    ;(allTimeSignups || []).forEach((row: any) => {
      const day = row.created_at?.split('T')[0]
      if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1
    })
    const sortedDays = Object.keys(dailyCounts).sort()
    let cumulative = 0
    const growthSeries = sortedDays.map(date => {
      cumulative += dailyCounts[date]
      return { date, count: cumulative }
    })

    function dedup(rows: any[]) {
      const seen = new Set()
      return rows.filter((r: any) => {
        const id = r.user_id || r.id
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
    }

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        totalCourses: totalCourses ?? 0,
        totalQcm: totalQcm ?? 0,
        perfectQcm: perfectQcm ?? 0,
        totalFlashcards: totalFlashcards ?? 0,
        estimatedApiCost,
        totalCoinsDistributed,
        avgCoursesPerUser: totalUsers ? ((totalCourses ?? 0) / totalUsers).toFixed(1) : '0',
        avgQcmPerUser,
      },
      recentUsers: recentUsers || [],
      topUsers: topUsers || [],
      activeUsersToday: activeUsersToday || [],
      usersWithCourses: dedup(usersWithCourses || []),
      usersWithQcm: dedup(usersWithQcm || []),
      usersWithPerfect: dedup(usersWithPerfect || []),
      premiumUsers: premiumUsers || [],
      streakUsers: streakUsers || [],
      growthSeries,
      timeSeries: {
        signups: signupsSeries,
        qcm: qcmSeries,
        courses: coursesSeries,
        coins: coinsSeries,
        avgQcm: avgQcmSeries,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
