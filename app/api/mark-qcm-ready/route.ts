import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { courseId } = await request.json()

  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json({ error: 'courseId requis' }, { status: 400 })
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })

  const { count } = await supabase
    .from('qcm_questions')
    .select('id', { count: 'exact' })
    .eq('course_id', courseId)

  if (!count || count === 0) {
    return NextResponse.json({ error: 'Aucun QCM genere' }, { status: 400 })
  }

  await supabase
    .from('courses')
    .update({ qcm_status: 'ready' })
    .eq('id', courseId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}