import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function GET() {
  // Auth check
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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
