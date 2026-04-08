import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const { classroomId, name, color } = await req.json()
    if (!classroomId || !name?.trim()) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    // Verifier que le user est prof de cette classe
    const { data: membership } = await supabase
      .from('classroom_teachers')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('teacher_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    // Trouver le prochain order_index
    const { data: existing } = await supabase
      .from('course_folders')
      .select('order_index')
      .eq('classroom_id', classroomId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

    const { data: folder, error } = await supabase
      .from('course_folders')
      .insert({
        classroom_id: classroomId,
        name: name.trim(),
        color: color || '#2563EB',
        is_default: false,
        created_by: user.id,
        order_index: nextIndex,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Erreur creation' }, { status: 500 })
    return NextResponse.json({ folder })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}