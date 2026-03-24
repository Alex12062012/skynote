import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { courseId } = await request.json()

  await supabase
    .from('courses')
    .update({ qcm_status: 'ready' })
    .eq('id', courseId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
