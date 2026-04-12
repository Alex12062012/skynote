import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

async function checkAdmin() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) return null
  return user
}

export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

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

// Toggle featured status for a feedback (max 3 featured)
export async function PATCH(request: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { feedbackId, featured } = await request.json()
  if (!feedbackId) return NextResponse.json({ error: 'feedbackId requis' }, { status: 400 })

  // If trying to feature, check that we don't exceed 3
  if (featured) {
    const { count } = await supabase
      .from('feedbacks')
      .select('id', { count: 'exact' })
      .eq('featured', true)
    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Maximum 3 avis en avant' }, { status: 400 })
    }
  }

  await supabase.from('feedbacks').update({ featured: !!featured }).eq('id', feedbackId)

  return NextResponse.json({ ok: true })
}
