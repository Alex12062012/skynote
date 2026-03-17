import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select('*, profiles(email, full_name, is_beta_tester)')
    .order('created_at', { ascending: false })
    .limit(100)

  const scores = (feedbacks || []).map((f: any) => f.score)
  const avgScore = scores.length
    ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
    : '0'

  return NextResponse.json({
    feedbacks: feedbacks || [],
    avgScore,
    total: feedbacks?.length ?? 0,
  })
}
