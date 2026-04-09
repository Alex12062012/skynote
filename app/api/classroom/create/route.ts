import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const DEFAULT_FOLDERS = [
  { name: 'Mathematiques',         color: '#2563EB' },
  { name: 'Francais',              color: '#DC2626' },
  { name: 'Histoire-Geographie',   color: '#D97706' },
  { name: 'Anglais',               color: '#0891B2' },
  { name: 'Sciences (SVT)',        color: '#059669' },
  { name: 'Physique-Chimie',       color: '#7C3AED' },
  { name: 'Philosophie',           color: '#E11D48' },
  { name: 'Economie (SES)',        color: '#F59E0B' },
  { name: 'Informatique (NSI)',    color: '#6D28D9' },
  { name: 'Sport (EPS)',           color: '#16A34A' },
  { name: 'Arts',                  color: '#EC4899' },
  { name: 'Autre',                 color: '#64748B' },
]

function generateClassCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateLoginCode(firstName: string, lastName: string): string {
  const clean = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
  const first = clean(firstName).charAt(0)
  const last = clean(lastName)
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789' // sans 0/o/l/1 pour eviter confusion
  let suffix = ''
  for (let i = 0; i < 5; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `${first}${last}-${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const { students } = await req.json() as { students: { firstName: string; lastName: string }[] }
    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Liste d\'eleves requise' }, { status: 400 })
    }

    // Verifier que l'utilisateur est bien un professeur
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Seuls les professeurs peuvent creer une classe' }, { status: 403 })
    }

    // Verifier si le prof a deja une classe
    const { data: existingClass } = await supabase.from('classrooms').select('id').eq('teacher_id', user.id).single()
    if (existingClass) {
      return NextResponse.json({ error: 'Vous avez deja une classe. Gerez-la depuis votre tableau de bord.' }, { status: 409 })
    }

    // Generer un code de classe unique (avec protection contre boucle infinie)
    let classCode = generateClassCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase.from('classrooms').select('id').eq('class_code', classCode).single()
      if (!existing) break
      classCode = generateClassCode()
      attempts++
    }
    if (attempts >= 10) {
      return NextResponse.json({ error: 'Impossible de generer un code unique. Reessayez.' }, { status: 500 })
    }

    // Creer la classe
    const { data: classroom, error: classError } = await supabase
      .from('classrooms')
      .insert({ teacher_id: user.id, class_code: classCode })
      .select()
      .single()

    if (classError || !classroom) {
      return NextResponse.json({ error: 'Erreur lors de la creation de la classe' }, { status: 500 })
    }

    // Creer les eleves avec leurs codes de connexion
    const studentRecords = students.map((s) => ({
      classroom_id: classroom.id,
      first_name: s.firstName.trim(),
      last_name: s.lastName.trim(),
      login_code: generateLoginCode(s.firstName, s.lastName),
    }))

    // Deduplication robuste des login_code
    const seen = new Map<string, number>()
    for (const record of studentRecords) {
      const base = record.login_code
      const count = seen.get(base) || 0
      if (count > 0) {
        // Suffixe clair : prenom2, prenom3, etc.
        record.login_code = `${base}x${count + 1}`
      }
      seen.set(base, count + 1)
    }

    const { error: studentsError } = await supabase
      .from('classroom_students')
      .insert(studentRecords)

    if (studentsError) {
      // Rollback : supprimer la classe
      await supabase.from('classrooms').delete().eq('id', classroom.id)
      return NextResponse.json({ error: 'Erreur lors de l\'ajout des eleves' }, { status: 500 })
    }

    // Ajouter le créateur dans classroom_teachers avec le rôle 'owner'
    await supabase.from('classroom_teachers').insert({
      classroom_id: classroom.id,
      teacher_id: user.id,
      role: 'owner',
    })

    // Créer les dossiers matières par défaut via le client admin (bypass RLS)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    await admin.from('course_folders').insert(
      DEFAULT_FOLDERS.map((f, i) => ({
        classroom_id: classroom.id,
        name: f.name,
        color: f.color,
        is_default: true,
        created_by: user.id,
        order_index: i,
      }))
    )

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
