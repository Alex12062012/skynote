import { generateFlashcards, generateQcmQuestions } from './generate'
import { createClient } from '@/lib/supabase/server'

export async function processCourse(courseId: string): Promise<void> {
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
    await supabase
      .from('courses')
      .update({ status: 'processing', progress: 10 })
      .eq('id', courseId)

    const flashcardsData = await generateFlashcards(course.title, course.subject, content)

    await supabase
      .from('courses')
      .update({ progress: 40 })
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

    const { data: insertedFlashcards, error: fcError } = await supabase
      .from('flashcards')
      .insert(flashcardInserts)
      .select('id, title, summary, key_points')

    if (fcError || !insertedFlashcards) {
      throw new Error(`Erreur insertion fiches : ${fcError?.message}`)
    }

    await supabase
      .from('courses')
      .update({ progress: 60 })
      .eq('id', courseId)

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
      await supabase.rpc('increment_coins', { p_user_id: userId, p_amount: obj.reward_coins })

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: obj.reward_coins,
        reason: `Objectif complete : ${obj.title}`,
      })
    }
  }
}