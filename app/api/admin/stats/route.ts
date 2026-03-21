import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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
  try {
    // Utiliser le service role pour bypasser le RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7' // '7', '30', 'all'

    // Pour "all" on prend 365 jours max
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
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }).eq('perfect', true),
      supabase.from('flashcards').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('id,email,full_name,sky_coins,plan,streak_days,created_at,last_login_at,is_beta_tester').order('created_at', { ascending: false, nullsFirst: false }).limit(50),
      supabase.from('profiles').select('id,email,full_name,sky_coins,plan,streak_days').order('sky_coins', { ascending: false }).limit(10),
      supabase.from('profiles').select('created_at').gte('created_at', sinceISO),
      supabase.from('qcm_attempts').select('created_at').gte('created_at', sinceISO),
      supabase.from('courses').select('created_at').gte('created_at', sinceISO),
      supabase.from('coin_transactions').select('amount,created_at').gte('created_at', sinceISO),
      supabase.from('qcm_attempts').select('user_id,created_at').gte('created_at', sinceISO),
    ])

    // Time series
    const signupsSeries = buildTimeSeries(days, allSignups || [], 'created_at')
    const qcmSeries = buildTimeSeries(days, allQcm || [], 'created_at')
    const coursesSeries = buildTimeSeries(days, allCourses || [], 'created_at')

    // Coins distribués par jour
    const coinsMap: Record<string, number> = {}
    days.forEach(d => { coinsMap[d] = 0 })
    ;(coinTransactions || []).forEach((tx: any) => {
      const day = tx.created_at?.split('T')[0]
      if (day && day in coinsMap && tx.amount > 0) coinsMap[day] += tx.amount
    })
    const coinsSeries = days.map(date => ({ date, count: coinsMap[date] }))

    // Moyenne QCM par élève par jour
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

    // Coût API estimé
    const estimatedApiCost = totalCourses
      ? (((totalCourses * 2000) / 1_000_000) * 3 + ((totalCourses * 1500) / 1_000_000) * 15).toFixed(2)
      : '0.00'

    // Total coins distribués
    const totalCoinsDistributed = (coinTransactions || [])
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    // Moyenne QCM par élève globale
    const avgQcmPerUser = totalUsers && totalQcm
      ? ((totalQcm ?? 0) / totalUsers).toFixed(1)
      : '0'

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
