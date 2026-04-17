import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const { classroomId, name, email } = await req.json()
    if (!classroomId || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 })
    }

    // Verifier que le user est owner de cette classe
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('id, class_code')
      .eq('id', classroomId)
      .eq('teacher_id', user.id)
      .single()

    if (!classroom) {
      return NextResponse.json({ error: 'Seul le createur peut ajouter des professeurs' }, { status: 403 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Config serveur manquante' }, { status: 500 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Chercher si le prof existe deja
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email.trim().toLowerCase())

    let teacherId: string

    if (existingUser) {
      teacherId = existingUser.id
      // Mettre a jour son role en teacher si besoin
      await admin.from('profiles').update({ role: 'teacher' }).eq('id', teacherId)
    } else {
      // Creer le compte prof confirme
      const password = `sk_prof_${classroom.class_code}_${Date.now()}`
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { full_name: name.trim(), role: 'teacher' },
      })

      if (createError || !newUser.user) {
        return NextResponse.json({ error: createError?.message || 'Erreur creation compte' }, { status: 500 })
      }

      teacherId = newUser.user.id

      // Creer le profil
      await admin.from('profiles').upsert({
        id: teacherId,
        email: email.trim().toLowerCase(),
        full_name: name.trim(),
        role: 'teacher',
        plan: 'free',
        sky_coins: 0,
        streak_days: 0,
      }, { onConflict: 'id' })
    }

    // Verifier qu'il n'est pas deja dans la classe
    const { data: existing } = await admin
      .from('classroom_teachers')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('teacher_id', teacherId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ce professeur est deja dans la classe' }, { status: 409 })
    }

    // Ajouter comme membre
    await admin.from('classroom_teachers').insert({
      classroom_id: classroomId,
      teacher_id: teacherId,
      role: 'member',
    })

    return NextResponse.json({ success: true, teacherId })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}