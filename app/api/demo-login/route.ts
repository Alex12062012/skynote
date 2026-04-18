import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const DEMO_ACCOUNTS: Record<string, {
  email: string; password: string; name: string
  role: 'teacher' | 'student'; classCode: string
}> = {
  mdubois253912: {
    email: 'demo-teacher@skynote.app',
    password: 'DemoTeacher253912!',
    name: 'Marie Dubois',
    role: 'teacher',
    classCode: '253912',
  },
  aroudaut253912: {
    email: 'demo-student@skynote.app',
    password: 'DemoStudent253912!',
    name: 'Alexandre Roudaut',
    role: 'student',
    classCode: '253912',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json() as { code: string }
    const account = DEMO_ACCOUNTS[code?.trim()?.toLowerCase()]
    if (!account) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 404 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquante dans les env' }, { status: 500 })
    }

    // Client admin = bypass RLS + peut creer des users confirmes
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Chercher si le user existe deja (par email directement)
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.email === account.email)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Creer le user CONFIRME via admin API
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.name, role: account.role },
      })

      if (createError || !newUser.user) {
        return NextResponse.json({ error: createError?.message || 'Erreur creation' }, { status: 500 })
      }
      userId = newUser.user.id
    }

    // Upsert profil avec le bon role (bypass RLS via service role)
    await admin.from('profiles').upsert({
      id: userId,
      email: account.email,
      full_name: account.name,
      role: account.role,
      plan: 'free',
      sky_coins: 50,
      streak_days: 3,
    }, { onConflict: 'id' })

    // Setup classe pour le prof
    if (account.role === 'teacher') {
      const { data: existingClass } = await admin
        .from('classrooms').select('id').eq('teacher_id', userId).maybeSingle()

      if (!existingClass) {
        const { data: classroom } = await admin
          .from('classrooms')
          .insert({ teacher_id: userId, class_code: account.classCode })
          .select().single()

        if (classroom) {
          await admin.from('classroom_students').insert([
            { classroom_id: classroom.id, first_name: 'Alexandre', last_name: 'Roudaut', login_code: 'aroudaut253912' },
            { classroom_id: classroom.id, first_name: 'Lucas', last_name: 'Martin', login_code: 'lmartin253912' },
            { classroom_id: classroom.id, first_name: 'Emma', last_name: 'Bernard', login_code: 'ebernard253912' },
          ])
        }
      }
    }

    // Lier l'eleve a la classe du prof + lier le classroom_student_id
    if (account.role === 'student') {
      const { data: classroom } = await admin
        .from('classrooms').select('id').eq('class_code', account.classCode).maybeSingle()

      if (classroom) {
        // Trouver le classroom_student correspondant
        const { data: classStudent } = await admin
          .from('classroom_students')
          .select('id')
          .eq('classroom_id', classroom.id)
          .eq('first_name', account.name.split(' ')[0])
          .eq('last_name', account.name.split(' ').slice(1).join(' '))
          .maybeSingle()

        await admin.from('profiles').update({
          classroom_id: classroom.id,
          classroom_student_id: classStudent?.id || null,
        }).eq('id', userId)
      }
    }

    return NextResponse.json({ success: true, role: account.role, email: account.email, password: account.password })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
