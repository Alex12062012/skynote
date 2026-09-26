import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processCourse } from '@/lib/ai/pipeline'
import { waitUntil } from '@vercel/functions'
import { NOVA_COST_COURSE, deductNovasForUser, addNovasForUser } from '@/lib/supabase/nova-actions'
import { AppError, Errors, apiError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { acquireGenerationLock, releaseGenerationLock, lockKeys } from '@/lib/generation-lock'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw Errors.unauthorized()

    const body = await request.json()
    const { courseId } = body

    if (!courseId || typeof courseId !== 'string') {
      throw Errors.badRequest('courseId manquant')
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(courseId)) {
      throw Errors.badRequest('courseId invalide')
    }

    const { data: course } = await supabase
      .from('courses')
      .select('id, status, user_id, progress, content_lang')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) throw Errors.notFound('Cours')

    // Pré-filtres bon marché. Ils NE protègent PAS de la concurrence : entre
    // cette lecture et l'écriture plus bas, une autre requête peut passer
    // exactement au même endroit. C'est le bail ci-dessous qui tranche.
    if (course.status === 'ready') {
      return NextResponse.json({ message: 'Cours deja genere' }, { status: 200 })
    }

    if (course.status === 'processing' && course.progress > 0) {
      return NextResponse.json({ message: 'Generation deja en cours' }, { status: 200 })
    }

    // Bail atomique AVANT tout effet de bord (quota, Novas, appel Claude).
    // Constaté en prod le 24/09 : deux requêtes à 453 ms d'écart ont toutes les
    // deux débité 118✦ et inséré 4 fiches — 236✦ pour 8 fiches en double.
    const lockKey = lockKeys.flashcards(courseId)
    if (!(await acquireGenerationLock(lockKey, user.id))) {
      return NextResponse.json({ message: 'Generation deja en cours' }, { status: 200 })
    }

    try {
      // Relecture sous le bail. Les pré-filtres plus haut ont été lus avant de
      // l'obtenir : si la requête concurrente a terminé entre-temps, ils sont
      // périmés et on débiterait 118✦ pour un cours déjà généré (processCourse
      // s'arrêterait sur sa garde « fiches déjà existantes », sans rien
      // rembourser puisqu'il n'échoue pas).
      const { count: existingFlashcards } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId)
      if ((existingFlashcards ?? 0) > 0) {
        await releaseGenerationLock(lockKey)
        return NextResponse.json({ message: 'Cours deja genere' }, { status: 200 })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      const isPremium = ['starter', 'pro'].includes(profile?.plan ?? '')
      const rlConfig = isPremium ? RATE_LIMITS.generatePaid : RATE_LIMITS.generateFree

      const rl = await checkRateLimit(user.id, 'generate', rlConfig)
      if (!rl.allowed) {
        const limit = isPremium ? 10 : 5
        await releaseGenerationLock(lockKey)
        return NextResponse.json(
          { error: `Limite atteinte : ${limit} générations par jour. Réessaie demain.` },
          { status: 429, headers: { 'X-RateLimit-Reset': String(rl.resetAt) } }
        )
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

      // La langue est posée sur la ligne du cours par createCourse : elle n'a
      // plus à voyager dans le body, et un second appel ne peut plus l'écraser.
      await supabase
        .from('courses')
        .update({ progress: 1 })
        .eq('id', courseId)

      waitUntil(
        processCourse(courseId, course.content_lang ?? undefined)
          .catch(async (err) => {
            console.error('[API /generate] Pipeline error — rollback Novas:', err)
            await addNovasForUser(
              user.id,
              NOVA_COST_COURSE,
              'Remboursement génération échouée — 118✦'
            )
          })
          // Libéré dans tous les cas : un échec doit laisser le cours
          // relançable tout de suite, sans attendre l'expiration du bail.
          .finally(() => releaseGenerationLock(lockKey))
      )

      return NextResponse.json(
        { message: 'Generation lancee', courseId, novaBalance: deductResult.balance },
        { status: 202 }
      )
    } catch (inner) {
      // Le bail ne doit jamais survivre à une sortie imprévue avant waitUntil.
      await releaseGenerationLock(lockKey).catch(() => {})
      throw inner
    }

  } catch (error) {
    return apiError(error)
  }
}
