import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const { classroomId, name, color } = await req.json()
    if (!classroomId || !name?.trim()) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    // Verifier que le user est prof de cette classe (membre OU créateur)
    const [{ data: membership }, { data: ownership }] = await Promise.all([
      supabase
        .from('classroom_teachers')
        .select('id')
        .eq('classroom_id', classroomId)
        .eq('teacher_id', user.id)
        .maybeSingle(),
      supabase
        .from('classrooms')
        .select('id')
        .eq('id', classroomId)
        .eq('teacher_id', user.id)
        .maybeSingle(),
    ])

    if (!membership && !ownership) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    // Si le créateur n'est pas encore dans classroom_teachers, l'y ajouter
    // (cas des classes créées avant le correctif)
    if (!membership && ownership) {
      await supabase.from('classroom_teachers').upsert({
        classroom_id: classroomId,
        teacher_id: user.id,
        role: 'owner',
      }, { onConflict: 'classroom_id,teacher_id' })
    }

    // Trouver le prochain order_index
    const { data: existing } = await supabase
      .from('course_folders')
      .select('order_index')
      .eq('classroom_id', classroomId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

    // Utiliser le client admin pour bypasser la RLS sur course_folders
    const { data: folder, error } = await admin
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

    if (error) return NextResponse.json({ error: `Erreur creation: ${error.message}` }, { status: 500 })
    return NextResponse.json({ folder })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}