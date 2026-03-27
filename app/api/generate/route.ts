import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processCourse } from '@/lib/ai/pipeline'
import { waitUntil } from '@vercel/functions'

export const maxDuration = 60

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

    // waitUntil maintient la fonction en vie après la réponse HTTP
    waitUntil(
      processCourse(courseId).catch((err) => {
        console.error('[API /generate] Pipeline error:', err)
      })
    )

    return NextResponse.json(
      { message: 'Génération lancée', courseId },
      { status: 202 }
    )

  } catch (error) {
    console.error('[API /generate] Error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
