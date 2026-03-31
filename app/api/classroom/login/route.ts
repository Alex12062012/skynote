import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { loginCode } = await req.json() as { loginCode: string }

    if (!loginCode || typeof loginCode !== 'string') {
      return NextResponse.json({ error: 'Code de connexion requis' }, { status: 400 })
    }

    const code = loginCode.trim().toLowerCase()

    // Trouver l'élève
    const { data: student, error: studentError } = await supabase
      .from('classroom_students')
      .select('*, classrooms(*)')
      .eq('login_code', code)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Code invalide. Vérifie ton identifiant.' }, { status: 404 })
    }

    // Créer un compte Supabase anonyme pour l'élève ou se connecter
    // On utilise un email fictif déterministe basé sur le login_code
    const fakeEmail = `${code}@classroom.skynote.app`
    const fakePassword = `sk_${code}_${student.classroom_id}`

    // Essayer de se connecter d'abord
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    })

    if (signInData?.user) {
      return NextResponse.json({
        success: true,
        studentName: `${student.first_name} ${student.last_name}`,
        classCode: (student as any).classrooms?.class_code,
      })
    }

    // Si pas de compte, en créer un
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: fakePassword,
      options: {
        data: {
          full_name: `${student.first_name} ${student.last_name}`,
          role: 'student',
        },
      },
    })

    if (signUpError || !signUpData.user) {
      return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 })
    }

    // Mettre à jour le profil avec les infos de classe
    await supabase.from('profiles').upsert({
      id: signUpData.user.id,
      email: fakeEmail,
      full_name: `${student.first_name} ${student.last_name}`,
      role: 'student',
      classroom_id: student.classroom_id,
      classroom_student_id: student.id,
      plan: 'free',
      sky_coins: 0,
      streak_days: 0,
      is_beta_tester: true,
    }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      studentName: `${student.first_name} ${student.last_name}`,
      classCode: (student as any).classrooms?.class_code,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
