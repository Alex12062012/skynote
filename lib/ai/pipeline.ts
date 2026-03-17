import { generateFlashcards, generateQcmQuestions } from './generate'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// PIPELINE PRINCIPAL : Course → Fiches + QCM
// ============================================================

export async function processCourse(courseId: string): Promise<void> {
  const supabase = await createClient()

  // 1. Récupérer le cours
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    throw new Error(`Cours introuvable : ${courseId}`)
  }

  // S'assurer qu'il y a du contenu à traiter
  const content = course.source_content
  if (!content || content.trim().length < 20) {
    await supabase
      .from('courses')
      .update({ status: 'error', progress: 0 })
      .eq('id', courseId)
    throw new Error('Contenu du cours trop court ou vide')
  }

  try {
    // 2. Mettre à jour la progression — génération fiches
    await supabase
      .from('courses')
      .update({ status: 'processing', progress: 10 })
      .eq('id', courseId)

    // 3. Générer les fiches avec l'IA
    const flashcardsData = await generateFlashcards(course.title, course.subject, content)

    await supabase
      .from('courses')
      .update({ progress: 40 })
      .eq('id', courseId)

    // 4. Insérer les fiches en BDD
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

    // 5. Générer les QCM pour chaque fiche (séquentiel pour fiabilité)
    const qcmInserts: any[] = []

    for (let i = 0; i < insertedFlashcards.length; i++) {
      const flashcard = insertedFlashcards[i]
      try {
        const keyPoints = Array.isArray(flashcard.key_points)
          ? flashcard.key_points
          : JSON.parse(String(flashcard.key_points) || '[]')

        const questions = await generateQcmQuestions(
          flashcard.title,
          flashcard.summary,
          keyPoints
        )

        qcmInserts.push(...questions.map((q) => ({
          flashcard_id: flashcard.id,
          course_id: courseId,
          user_id: course.user_id,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation,
        })))
      } catch {
        // On continue même si une fiche échoue
      }

      // Mettre à jour la progression
      const progressStep = 60 + Math.round(((i + 1) / insertedFlashcards.length) * 35)
      await supabase
        .from('courses')
        .update({ progress: Math.min(progressStep, 95) })
        .eq('id', courseId)
    }

    // 6. Insérer tous les QCM
    if (qcmInserts.length > 0) {
      await supabase.from('qcm_questions').insert(qcmInserts)
    }

    // 7. Marquer le cours comme prêt !
    await supabase
      .from('courses')
      .update({ status: 'ready', progress: 0 })
      .eq('id', courseId)

    // 8. Vérifier et attribuer l'objectif "premier cours"
    await checkAndAwardObjectives(courseId, course.user_id)

  } catch (error) {
    console.error(`[AI Pipeline] Erreur pour le cours ${courseId}:`, error)

    // Marquer le cours en erreur
    await supabase
      .from('courses')
      .update({ status: 'error', progress: 0 })
      .eq('id', courseId)

    throw error
  }
}

// ============================================================
// OBJECTIFS — Vérifier et attribuer après génération
// ============================================================

async function checkAndAwardObjectives(courseId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  // Compter le nombre de cours de l'utilisateur
  const { count: courseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'ready')

  // Récupérer tous les objectifs liés aux cours
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

    // Attribuer les Sky Coins si complété
    if (isCompleted) {
      await supabase.from('profiles').update({
        sky_coins: supabase.rpc('increment_coins', { user_id: userId, amount: obj.reward_coins }),
      })

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: obj.reward_coins,
        reason: `Objectif complété : ${obj.title}`,
      })
    }
  }
}
