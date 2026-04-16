import { generateFlashcards, generateQcmQuestions } from './generate'
import { createClient } from '@/lib/supabase/server'
import type { QcmDifficulty } from './prompts'

const ALL_DIFFICULTIES: QcmDifficulty[] = ['peaceful', 'easy', 'medium', 'hard']

/**
 * PHASE 1 — Genere les fiches et marque le cours comme pret.
 * Les QCM restent en qcm_status='processing' pour etre generes en arriere-plan.
 * Rapide : 1 seul appel Claude (~15s).
 */
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
    // Etape 1 : generation des fiches
    await supabase
      .from('courses')
      .update({ status: 'processing', progress: 10 })
      .eq('id', courseId)

    const flashcardsData = await generateFlashcards(course.title, course.subject, content)

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

/**
 * PHASE 2 — Genere les QCM (4 niveaux) pour toutes les fiches du cours.
 * Appelee en arriere-plan apres que le cours est deja marque 'ready'.
 * Peut prendre jusqu'a 60s selon le nombre de fiches.
 */
export async function processQcmsForCourse(courseId: string): Promise<void> {
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('user_id, qcm_status')
    .eq('id', courseId)
    .single()

  if (!course) {
    console.warn('[QCM Pipeline] Cours introuvable :', courseId)
    return
  }

  if (course.qcm_status === 'ready') {
    console.log('[QCM Pipeline] QCM deja generes pour', courseId)
    return
  }

  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('id, title, summary, key_points')
    .eq('course_id', courseId)
    .order('order_index')

  if (!flashcards || flashcards.length === 0) {
    console.warn('[QCM Pipeline] Aucune fiche pour', courseId)
    return
  }

  // Verifier si des QCM existent deja (anti-doublon)
  const { count: existingQcm } = await supabase
    .from('qcm_questions')
    .select('id', { count: 'exact' })
    .eq('course_id', courseId)

  if ((existingQcm ?? 0) > 0) {
    // QCM partiellement ou completement generes — on marque ready
    await supabase
      .from('courses')
      .update({ qcm_status: 'ready' })
      .eq('id', courseId)
    return
  }

  try {
    let totalInserted = 0

    for (const flashcard of flashcards) {
      const keyPoints: string[] = Array.isArray(flashcard.key_points)
        ? flashcard.key_points
        : (() => { try { return JSON.parse(String(flashcard.key_points || '[]')) } catch { return [] } })()

      // 4 niveaux en parallele pour cette fiche
      const results = await Promise.allSettled(
        ALL_DIFFICULTIES.map(async (difficulty) => {
          try {
            const questions = await generateQcmQuestions(
              flashcard.title,
              flashcard.summary,
              keyPoints,
              difficulty
            )
            if (questions.length > 0) {
              const { error } = await supabase.from('qcm_questions').insert(
                questions.map((q) => ({
                  flashcard_id: flashcard.id,
                  course_id: courseId,
                  user_id: course.user_id,
                  question: q.question,
                  options: q.options,
                  correct_index: q.correct_index,
                  explanation: q.explanation,
                  difficulty,
                }))
              )
              if (!error) return questions.length
            }
            return 0
          } catch (err) {
            console.error(`[QCM Pipeline] ${difficulty} pour fiche ${flashcard.id}:`, err)
            return 0
          }
        })
      )
      totalInserted += results.reduce((sum, r) => sum + (r.status === 'fulfilled' ? (r.value ?? 0) : 0), 0)
    }

    // Marquer ready seulement si des questions ont ete inserees
    if (totalInserted > 0) {
      await supabase.from('courses').update({ qcm_status: 'ready' }).eq('id', courseId)
      console.log(`[QCM Pipeline] ${totalInserted} questions generees pour ${courseId}`)
    } else {
      console.warn(`[QCM Pipeline] Aucune question generee pour ${courseId} — qcm_status reste processing`)
    }

  } catch (error) {
    console.error(`[QCM Pipeline] Erreur pour le cours ${courseId}:`, error)
    // On ne marque pas en erreur — les QCM peuvent etre regeneres via QcmGenerator
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
