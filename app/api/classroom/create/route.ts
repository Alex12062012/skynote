import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateClassCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateLoginCode(firstName: string, lastName: string, classCode: string): string {
  const clean = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
  const first = clean(firstName).charAt(0)
  const last = clean(lastName)
  return `${first}${last}${classCode}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { students } = await req.json() as { students: { firstName: string; lastName: string }[] }
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Liste d\'élèves requise' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est bien un professeur
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Seuls les professeurs peuvent créer une classe' }, { status: 403 })
    }

    // Vérifier si le prof a déjà une classe
    const { data: existingClass } = await supabase.from('classrooms').select('id').eq('teacher_id', user.id).single()
    if (existingClass) {
      return NextResponse.json({ error: 'Vous avez déjà une classe. Gérez-la depuis votre tableau de bord.' }, { status: 409 })
    }

    // Générer un code de classe unique
    let classCode = generateClassCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase.from('classrooms').select('id').eq('class_code', classCode).single()
      if (!existing) break
      classCode = generateClassCode()
      attempts++
    }

    // Créer la classe
    const { data: classroom, error: classError } = await supabase
      .from('classrooms')
      .insert({ teacher_id: user.id, class_code: classCode })
      .select()
      .single()

    if (classError || !classroom) {
      return NextResponse.json({ error: 'Erreur lors de la création de la classe' }, { status: 500 })
    }

    // Créer les élèves avec leurs codes de connexion
    const studentRecords = students.map((s) => ({
      classroom_id: classroom.id,
      first_name: s.firstName.trim(),
      last_name: s.lastName.trim(),
      login_code: generateLoginCode(s.firstName, s.lastName, classCode),
    }))

    // Vérifier les doublons de login_code
    const codes = studentRecords.map(s => s.login_code)
    const uniqueCodes = new Set(codes)
    if (uniqueCodes.size !== codes.length) {
      // Ajouter un suffixe numérique pour les doublons
      const seen = new Map<string, number>()
      for (const record of studentRecords) {
        const count = seen.get(record.login_code) || 0
        if (count > 0) {
          record.login_code = `${record.login_code}${count}`
        }
        seen.set(record.login_code, count + 1)
      }
    }

    const { error: studentsError } = await supabase
      .from('classroom_students')
      .insert(studentRecords)

    if (studentsError) {
      // Rollback : supprimer la classe
      await supabase.from('classrooms').delete().eq('id', classroom.id)
      return NextResponse.json({ error: 'Erreur lors de l\'ajout des élèves' }, { status: 500 })
    }

    return NextResponse.json({
      classCode: classroom.class_code,
      classroomId: classroom.id,
      students: studentRecords.map(s => ({
        firstName: s.first_name,
        lastName: s.last_name,
        loginCode: s.login_code,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
