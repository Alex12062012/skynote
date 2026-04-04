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
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'courseId manquant' }, { status: 400 })
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(courseId)) {
      return NextResponse.json({ error: 'courseId invalide' }, { status: 400 })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('id, status, user_id, progress')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
    }

    if (course.status === 'ready') {
      return NextResponse.json({ message: 'Cours deja genere' }, { status: 200 })
    }

    // ANTI-DOUBLON : si progress > 0, la generation est deja en cours
    if (course.status === 'processing' && course.progress > 0) {
      return NextResponse.json({ message: 'Generation deja en cours' }, { status: 200 })
    }

    // Marquer immediatement progress > 0 pour bloquer les appels suivants
    await supabase
      .from('courses')
      .update({ progress: 1 })
      .eq('id', courseId)

    waitUntil(
      processCourse(courseId).catch((err) => {
        console.error('[API /generate] Pipeline error:', err)
      })
    )

    return NextResponse.json(
      { message: 'Generation lancee', courseId },
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
