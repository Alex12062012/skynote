import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processCourse } from '@/lib/ai/pipeline'
import { waitUntil } from '@vercel/functions'
import { NOVA_COST_COURSE, deductNovasForUser, addNovasForUser } from '@/lib/supabase/nova-actions'
import { AppError, Errors, apiError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw Errors.unauthorized()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    // Rétrocompat : starter/pro ET anciens plans plus/famille ont le quota payant
    const isPremium = ['starter', 'pro', 'plus', 'famille'].includes(profile?.plan ?? '')
    const rlConfig = isPremium ? RATE_LIMITS.generatePaid : RATE_LIMITS.generateFree

    const rl = await checkRateLimit(user.id, 'generate', rlConfig)
    if (!rl.allowed) {
      const limit = isPremium ? 10 : 5
      return NextResponse.json(
        { error: `Limite atteinte : ${limit} générations par jour. Réessaie demain.` },
        { status: 429, headers: { 'X-RateLimit-Reset': String(rl.resetAt) } }
      )
    }

    const body = await request.json()
    const { courseId, contentLang } = body

    if (!courseId || typeof courseId !== 'string') {
      throw Errors.badRequest('courseId manquant')
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(courseId)) {
      throw Errors.badRequest('courseId invalide')
    }

    const { data: course } = await supabase
      .from('courses')
      .select('id, status, user_id, progress')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) throw Errors.notFound('Cours')

    if (course.status === 'ready') {
      return NextResponse.json({ message: 'Cours deja genere' }, { status: 200 })
    }

    if (course.status === 'processing' && course.progress > 0) {
      return NextResponse.json({ message: 'Generation deja en cours' }, { status: 200 })
    }

    const deductResult = await deductNovasForUser(
      user.id,
      NOVA_COST_COURSE,
      'Génération cours (fiches + QCM) — 118✦'
    )
    if (!deductResult.ok) {
      // Sans ça, le cours reste bloqué en "processing" pour toujours — l'utilisateur
      // voit un loader infini sans jamais savoir que c'est un manque de Novas.
      await supabase.from('courses').update({ status: 'error' }).eq('id', courseId)
      throw new AppError(deductResult.error ?? 'Novas insuffisantes', 402, 'insufficient_novas')
    }

    await supabase
      .from('courses')
      .update({ progress: 1 })
      .eq('id', courseId)

    waitUntil(
      processCourse(courseId, contentLang).catch(async (err) => {
        console.error('[API /generate] Pipeline error — rollback Novas:', err)
        await addNovasForUser(
          user.id,
          NOVA_COST_COURSE,
          'Remboursement génération échouée — 118✦'
        )
      })
    )

    return NextResponse.json(
      { message: 'Generation lancee', courseId, novaBalance: deductResult.balance },
      { status: 202 }
    )

  } catch (error) {
    return apiError(error)
  }
}
