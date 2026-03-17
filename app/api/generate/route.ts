import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processCourse } from '@/lib/ai/pipeline'

/**
 * POST /api/generate
 * Corps : { courseId: string }
 *
 * Déclenche la génération IA des fiches + QCM pour un cours.
 * Appelée depuis le client juste après la création du cours.
 * Protected : user doit être connecté ET propriétaire du cours.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'courseId manquant' }, { status: 400 })
    }

    // Vérifier que le cours appartient à l'utilisateur
    const { data: course } = await supabase
      .from('courses')
      .select('id, status, user_id')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
    }

    if (course.status === 'ready') {
      return NextResponse.json({ message: 'Cours déjà généré' }, { status: 200 })
    }

    // Attendre la génération complète (nécessaire sur Vercel)
    await processCourse(courseId)

    return NextResponse.json(
      { message: 'Génération terminée', courseId },
      { status: 200 }
    )

  } catch (error) {
    console.error('[API /generate] Error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
