import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getDaysArray(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return d.toISOString().split('T')[0]
  })
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const since30d = new Date(now); since30d.setDate(since30d.getDate() - 30)
  const since7d = new Date(now); since7d.setDate(since7d.getDate() - 7)
  const since1d = new Date(now); since1d.setDate(since1d.getDate() - 1)

  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalQcm },
    { count: perfectQcm },
    { count: totalFlashcards },
    { data: allProfiles },
    { data: signups30d },
    { data: qcm30d },
    { data: courses30d },
    { data: feedbacks },
    { data: coinTransactions },
    { data: activeToday },
    { data: active7d },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }),
    supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }).eq('perfect', true),
    supabase.from('flashcards').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, sky_coins, plan, streak_days, created_at, last_login_at'),
    supabase.from('profiles').select('created_at').gte('created_at', since30d.toISOString()),
    supabase.from('qcm_attempts').select('created_at, user_id').gte('created_at', since30d.toISOString()),
    supabase.from('courses').select('created_at').gte('created_at', since30d.toISOString()),
    supabase.from('feedbacks').select('score, love, missing, created_at'),
    supabase.from('coin_transactions').select('amount, created_at').gte('created_at', since30d.toISOString()),
    supabase.from('profiles').select('id').gte('last_login_at', since1d.toISOString()),
    supabase.from('profiles').select('id').gte('last_login_at', since7d.toISOString()),
  ])

  // ── Courbes 30 jours ──
  const days30 = getDaysArray(30)
  const signupsMap: Record<string, number> = {}
  const qcmMap: Record<string, number> = {}
  const coursesMap: Record<string, number> = {}
  days30.forEach(d => { signupsMap[d] = 0; qcmMap[d] = 0; coursesMap[d] = 0 })
  ;(signups30d || []).forEach((s: any) => { const d = s.created_at?.split('T')[0]; if (d in signupsMap) signupsMap[d]++ })
  ;(qcm30d || []).forEach((q: any) => { const d = q.created_at?.split('T')[0]; if (d in qcmMap) qcmMap[d]++ })
  ;(courses30d || []).forEach((c: any) => { const d = c.created_at?.split('T')[0]; if (d in coursesMap) coursesMap[d]++ })

  const signupsSeries = days30.map(date => ({ date, count: signupsMap[date] }))
  const qcmSeries = days30.map(date => ({ date, count: qcmMap[date] }))
  const coursesSeries = days30.map(date => ({ date, count: coursesMap[date] }))

  // ── Rétention ──
  const totalU = totalUsers ?? 0
  const dau = activeToday?.length ?? 0
  const wau = active7d?.length ?? 0
  const dauRate = totalU > 0 ? ((dau / totalU) * 100).toFixed(1) : '0'
  const wauRate = totalU > 0 ? ((wau / totalU) * 100).toFixed(1) : '0'

  // ── Rétention 7j (inscrits il y a 7-14 jours qui sont revenus) ──
  const since14d = new Date(now); since14d.setDate(since14d.getDate() - 14)
  const newUsersWeek = (allProfiles || []).filter((p: any) => {
    const created = new Date(p.created_at)
    return created >= since14d && created <= since7d
  })
  const retained = newUsersWeek.filter((p: any) => p.last_login_at && new Date(p.last_login_at) >= since7d)
  const retention7d = newUsersWeek.length > 0 ? ((retained.length / newUsersWeek.length) * 100).toFixed(0) : 'N/A'

  // ── Engagement ──
  const avgCoursesPerUser = totalU > 0 ? ((totalCourses ?? 0) / totalU).toFixed(1) : '0'
  const avgQcmPerUser = totalU > 0 ? ((totalQcm ?? 0) / totalU).toFixed(1) : '0'
  const perfectRate = (totalQcm ?? 0) > 0 ? (((perfectQcm ?? 0) / (totalQcm ?? 1)) * 100).toFixed(1) : '0'
  const avgStreak = allProfiles?.length
    ? ((allProfiles.reduce((s: number, p: any) => s + (p.streak_days || 0), 0)) / allProfiles.length).toFixed(1)
    : '0'

  // ── Plans ──
  const planCounts = { free: 0, plus: 0, famille: 0 }
  const paidCounts = { plus: 0, famille: 0 } // Vrais payants uniquement (Stripe)
  ;(allProfiles || []).forEach((p: any) => {
    if (p.plan === 'plus' || p.plan === 'premium') {
      planCounts.plus++
      if (!p.is_manual_upgrade) paidCounts.plus++
    } else if (p.plan === 'famille') {
      planCounts.famille++
      if (!p.is_manual_upgrade) paidCounts.famille++
    } else {
      planCounts.free++
    }
  })
  const paidTotal = paidCounts.plus + paidCounts.famille
  const conversionRate = totalU > 0 ? ((paidTotal / totalU) * 100).toFixed(1) : '0'
  const mrr = (paidCounts.plus * 4.99 + paidCounts.famille * 11.99).toFixed(2)
  const arr = (parseFloat(mrr) * 12).toFixed(2)
  const ltv = ((paidCounts.plus * 4.99 * 12) + (paidCounts.famille * 11.99 * 12)).toFixed(2)

  // ── Feedbacks ──
  const scores = (feedbacks || []).map((f: any) => f.score)
  const avgScore = scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : 'N/A'
  const nps = scores.filter((s: number) => s >= 9).length - scores.filter((s: number) => s <= 6).length
  const npsScore = scores.length > 0 ? Math.round((nps / scores.length) * 100) : 0

  // ── Coins distribués ──
  const totalCoins = (coinTransactions || [])
    .filter((t: any) => t.amount > 0)
    .reduce((s: number, t: any) => s + t.amount, 0)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    kpis: {
      totalUsers: totalU,
      dau, wau, dauRate, wauRate, retention7d,
      totalCourses: totalCourses ?? 0,
      totalQcm: totalQcm ?? 0,
      perfectQcm: perfectQcm ?? 0,
      totalFlashcards: totalFlashcards ?? 0,
      avgCoursesPerUser, avgQcmPerUser, perfectRate, avgStreak,
      planCounts, conversionRate, mrr, arr, ltv,
      avgScore, npsScore, feedbackCount: feedbacks?.length ?? 0,
      totalCoins,
    },
    charts: { signups: signupsSeries, qcm: qcmSeries, courses: coursesSeries },
    feedbacks: (feedbacks || []).slice(0, 10),
  })
}
