import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const [
      { count: totalUsers },
      { count: totalCourses },
      { count: totalQcm },
      { count: perfectQcm },
      { count: totalFlashcards },
      { data: recentUsers },
      { data: topUsers },
      { data: dailySignups },
      { data: coinTransactions },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('qcm_attempts').select('*', { count: 'exact', head: true }).eq('perfect', true),
      supabase.from('flashcards').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('id,email,full_name,sky_coins,plan,streak_days,created_at,last_login_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('id,email,full_name,sky_coins,plan,streak_days').order('sky_coins', { ascending: false }).limit(10),
      supabase.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('coin_transactions').select('amount,created_at').order('created_at', { ascending: false }).limit(200),
    ])

    // Calculer les inscriptions par jour (7 derniers jours)
    const last7Days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      last7Days[key] = 0
    }
    ;(dailySignups || []).forEach((u: any) => {
      const day = u.created_at?.split('T')[0]
      if (day && day in last7Days) last7Days[day]++
    })

    // Estimer le coût API Anthropic
    // Moyenne : ~2000 tokens input + ~1500 tokens output par cours
    // Prix claude-sonnet : $3/M input + $15/M output
    const estimatedApiCost = totalCourses
      ? (((totalCourses * 2000) / 1_000_000) * 3 + ((totalCourses * 1500) / 1_000_000) * 15).toFixed(2)
      : '0.00'

    // Total coins distribués
    const totalCoinsDistributed = (coinTransactions || [])
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0)

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
      },
      recentUsers: recentUsers || [],
      topUsers: topUsers || [],
      dailySignups: Object.entries(last7Days).map(([date, count]) => ({ date, count })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
