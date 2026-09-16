import { generateFlashcards } from './generate'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PHASE 1 — Genere les fiches et marque le cours comme pret.
 * Les QCM restent en qcm_status='processing' : ils sont generes ensuite cote
 * client par QcmGenerator (fiches × niveaux appels a /api/generate-qcm),
 * couverts par les Novas deja deduits pour le cours.
 * Rapide : 1 seul appel Claude (~15s).
 */
export async function processCourse(courseId: string, contentLang?: string): Promise<void> {
  const supabase = await createClient()

  const { count: existingFlashcards } = await supabase
    .from('flashcards')
    .select('id', { count: 'exact' })
    .eq('course_id', courseId)

  if ((existingFlashcards ?? 0) > 0) {
    console.log('[AI Pipeline] Fiches deja existantes pour', courseId)
    return
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    throw new Error(`Cours introuvable : ${courseId}`)
  }

  const content = course.source_content
  if (!content || content.trim().length < 20) {
    await supabase
      .from('courses')
      .update({ status: 'error', progress: 0 })
      .eq('id', courseId)
    throw new Error('Contenu du cours trop court ou vide')
  }

  try {
    // Etape 1 : generation des fiches
    await supabase
      .from('courses')
      .update({ status: 'processing', progress: 10 })
      .eq('id', courseId)

    const flashcardsData = await generateFlashcards(course.title, course.subject, content, contentLang)

    await supabase
      .from('courses')
      .update({ progress: 70 })
      .eq('id', courseId)

    const flashcardInserts = flashcardsData.map((f, index) => ({
      course_id: courseId,
      user_id: course.user_id,
      title: f.title,
      summary: f.summary,
      key_points: f.key_points,
      is_mastered: false,
      order_index: index,
    }))

    const { error: fcError } = await supabase
      .from('flashcards')
      .insert(flashcardInserts)

    if (fcError) {
      throw new Error(`Erreur insertion fiches : ${fcError?.message}`)
    }

    // Cours marque comme pret — les QCM seront generes en arriere-plan
    await supabase
      .from('courses')
      .update({ status: 'ready', progress: 0, qcm_status: 'processing' })
      .eq('id', courseId)

    await checkAndAwardObjectives(courseId, course.user_id)

  } catch (error) {
    console.error(`[AI Pipeline] Erreur pour le cours ${courseId}:`, error)
    await supabase
      .from('courses')
      .update({ status: 'error', progress: 0 })
      .eq('id', courseId)
    throw error
  }
}

async function checkAndAwardObjectives(courseId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { count: courseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'ready')

  const { data: objectives } = await supabase
    .from('objectives')
    .select('*')
    .in('key', ['first_course', 'five_courses'])

  if (!objectives) return

  for (const obj of objectives) {
    const { data: userObj } = await supabase
      .from('user_objectives')
      .select('*')
      .eq('user_id', userId)
      .eq('objective_id', obj.id)
      .single()

    if (userObj?.completed) continue

    const currentValue = courseCount ?? 0
    const isCompleted = currentValue >= obj.target_value

    if (userObj) {
      await supabase
        .from('user_objectives')
        .update({
          current_value: currentValue,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', userObj.id)
    } else {
      await supabase.from('user_objectives').insert({
        user_id: userId,
        objective_id: obj.id,
        current_value: currentValue,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
    }

    if (isCompleted) {
      await createAdminClient().rpc('increment_coins', { p_user_id: userId, p_amount: obj.reward_coins })
      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: obj.reward_coins,
        reason: `Objectif complete : ${obj.title}`,
      })
    }
  }
}
