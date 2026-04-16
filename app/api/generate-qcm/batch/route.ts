import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processQcmsForCourse } from '@/lib/ai/pipeline'
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

    // Verifier que le cours appartient a cet utilisateur
    const { data: course } = await supabase
      .from('courses')
      .select('id, status, qcm_status, user_id')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
    }

    if (course.qcm_status === 'ready') {
      return NextResponse.json({ message: 'QCM deja generes' }, { status: 200 })
    }

    // Lancer la generation en arriere-plan
    waitUntil(
      processQcmsForCourse(courseId).catch((err) => {
        console.error('[API /generate-qcm/batch] Error:', err)
      })
    )

    return NextResponse.json(
      { message: 'Generation QCM lancee', courseId },
      { status: 202 }
    )

  } catch (error) {
    console.error('[API /generate-qcm/batch] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
