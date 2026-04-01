import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Utiliser le service_role via env pour créer des comptes sans confirmation email
    // Mais on a pas le service_role côté client, donc on utilise le supabase normal
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
        },
      }
    )

    // Vérifier si le compte existe déjà en essayant de se connecter
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    let userId = signInData?.user?.id

    if (!userId) {
      // Créer le compte
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: { full_name: account.name, role: account.role },
        },
      })

      if (signUpError) {
        return NextResponse.json({ error: signUpError.message }, { status: 500 })
      }
      userId = signUpData?.user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'Impossible de créer le compte' }, { status: 500 })
    }

    // Mettre à jour / créer le profil avec le bon rôle
    await supabase.from('profiles').upsert({
      id: userId,
      email: account.email,
      full_name: account.name,
      role: account.role,
      plan: 'free',
      sky_coins: 50,
      streak_days: 3,
      is_beta_tester: true,
    }, { onConflict: 'id' })

    // Setup classe pour le prof
    if (account.role === 'teacher') {
      const { data: existingClass } = await supabase
        .from('classrooms').select('id').eq('teacher_id', userId).maybeSingle()

      if (!existingClass) {
        const { data: classroom } = await supabase
          .from('classrooms')
          .insert({ teacher_id: userId, class_code: account.classCode })
          .select().single()

        if (classroom) {
          await supabase.from('classroom_students').insert([
            { classroom_id: classroom.id, first_name: 'Alexandre', last_name: 'Roudaut', login_code: 'aroudaut253912' },
            { classroom_id: classroom.id, first_name: 'Lucas', last_name: 'Martin', login_code: 'lmartin253912' },
            { classroom_id: classroom.id, first_name: 'Emma', last_name: 'Bernard', login_code: 'ebernard253912' },
          ])
        }
      }
    }

    // Lier l'élève à la classe du prof
    if (account.role === 'student') {
      const { data: classroom } = await supabase
        .from('classrooms').select('id').eq('class_code', account.classCode).maybeSingle()

      if (classroom) {
        await supabase.from('profiles').update({
          classroom_id: classroom.id,
        }).eq('id', userId)
      }
    }

    // Déconnecter côté serveur (le client fera son propre signIn)
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, role: account.role })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
