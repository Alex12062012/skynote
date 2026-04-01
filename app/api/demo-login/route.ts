import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Comptes de test en dur
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

    const supabase = await createClient()

    // Essayer de se connecter
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (signInData?.user) {
      // Mettre à jour le profil
      await supabase.from('profiles').upsert({
        id: signInData.user.id,
        email: account.email,
        full_name: account.name,
        role: account.role,
        plan: 'free',
        sky_coins: 50,
        streak_days: 3,
        is_beta_tester: true,
      }, { onConflict: 'id' })

      return NextResponse.json({ success: true, name: account.name, role: account.role })
    }

    // Sinon créer le compte
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: { full_name: account.name, role: account.role },
      },
    })

    if (signUpError || !signUpData.user) {
      return NextResponse.json({ error: signUpError?.message || 'Erreur création compte' }, { status: 500 })
    }

    // Créer le profil
    await supabase.from('profiles').upsert({
      id: signUpData.user.id,
      email: account.email,
      full_name: account.name,
      role: account.role,
      plan: 'free',
      sky_coins: 50,
      streak_days: 3,
      is_beta_tester: true,
    }, { onConflict: 'id' })

    // Si c'est le prof, créer la classe et les élèves
    if (account.role === 'teacher') {
      const { data: existingClass } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', signUpData.user.id)
        .single()

      if (!existingClass) {
        const { data: classroom } = await supabase
          .from('classrooms')
          .insert({ teacher_id: signUpData.user.id, class_code: account.classCode })
          .select()
          .single()

        if (classroom) {
          await supabase.from('classroom_students').insert([
            { classroom_id: classroom.id, first_name: 'Alexandre', last_name: 'Roudaut', login_code: 'aroudaut253912' },
            { classroom_id: classroom.id, first_name: 'Lucas', last_name: 'Martin', login_code: 'lmartin253912' },
            { classroom_id: classroom.id, first_name: 'Emma', last_name: 'Bernard', login_code: 'ebernard253912' },
          ])
        }
      }
    }

    // Si c'est l'élève, lier à la classe du prof
    if (account.role === 'student') {
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('id')
        .eq('class_code', account.classCode)
        .single()

      if (classroom) {
        await supabase.from('profiles').update({
          classroom_id: classroom.id,
        }).eq('id', signUpData.user.id)
      }
    }

    // Se connecter après la création
    await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    return NextResponse.json({ success: true, name: account.name, role: account.role })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
