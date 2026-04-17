import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { loginCode } = await req.json() as { loginCode: string }

    if (!loginCode || typeof loginCode !== 'string') {
      return NextResponse.json({ error: 'Code de connexion requis' }, { status: 400 })
    }

    const code = loginCode.trim().toLowerCase()

    // Trouver l'eleve (avec admin pour bypass RLS)
    const { data: student, error: studentError } = await admin
      .from('classroom_students')
      .select('*, classrooms(*)')
      .eq('login_code', code)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Code invalide. Verifie ton identifiant.' }, { status: 404 })
    }

    // Email/password deterministes pour l'eleve
    const fakeEmail = `${code}@classroom.skynote.app`
    const fakePassword = `sk_${code}_${student.classroom_id}`

    // Chercher si le user existe deja
    const { data: existingUserData } = await admin.auth.admin.listUsers()
    const existingUser = existingUserData?.users?.find((u: any) => u.email === fakeEmail)

    if (existingUser) {
      // Le compte existe, renvoyer les credentials pour login cote client
      return NextResponse.json({
        success: true,
        email: fakeEmail,
        password: fakePassword,
        studentName: `${student.first_name} ${student.last_name}`,
        classCode: (student as any).classrooms?.class_code,
      })
    }

    // Creer le user confirme via admin API
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: fakeEmail,
      password: fakePassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${student.first_name} ${student.last_name}`,
        role: 'student',
      },
    })

    if (createError || !newUser.user) {
      return NextResponse.json({ error: 'Erreur lors de la creation du compte' }, { status: 500 })
    }

    // Mettre a jour le profil avec les infos de classe
    await admin.from('profiles').upsert({
      id: newUser.user.id,
      email: fakeEmail,
      full_name: `${student.first_name} ${student.last_name}`,
      role: 'student',
      classroom_id: student.classroom_id,
      classroom_student_id: student.id,
      plan: 'free',
      sky_coins: 0,
      streak_days: 0,
    }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      email: fakeEmail,
      password: fakePassword,
      studentName: `${student.first_name} ${student.last_name}`,
      classCode: (student as any).classrooms?.class_code,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
