'use server'

import { createClient } from './server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Réclamer les coins d'un objectif complété.
 * Retourne le montant crédité et le nouveau solde.
 */
export async function claimObjectiveReward(
  objectiveId: string
): Promise<{ coinsAwarded: number; newBalance: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { coinsAwarded: 0, newBalance: 0, error: 'Non connecté' }

  // Récupérer l'objectif
  const { data: obj } = await supabase
    .from('objectives')
    .select('*')
    .eq('id', objectiveId)
    .single()

  if (!obj) return { coinsAwarded: 0, newBalance: 0, error: 'Objectif introuvable' }

  // Récupérer le user_objective
  const { data: userObj } = await supabase
    .from('user_objectives')
    .select('*')
    .eq('user_id', user.id)
    .eq('objective_id', objectiveId)
    .single()

  if (!userObj?.completed) return { coinsAwarded: 0, newBalance: 0, error: 'Objectif non complété' }
  if (userObj.claimed) return { coinsAwarded: 0, newBalance: 0, error: 'Déjà réclamé' }

  // Marquer comme réclamé
  await supabase
    .from('user_objectives')
    .update({ claimed: true, claimed_at: new Date().toISOString() })
    .eq('id', userObj.id)

  // Créditer via RPC atomique (jamais de update direct sur sky_coins)
  await supabase.rpc('increment_coins', {
    p_user_id: user.id,
    p_amount: obj.reward_coins,
  })

  await supabase.from('coin_transactions').insert({
    user_id: user.id,
    amount: obj.reward_coins,
    reason: `Récompense réclamée : ${obj.title}`,
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('sky_coins')
    .eq('id', user.id)
    .single()

  const newBalance = profile?.sky_coins ?? 0

  revalidatePath('/objectives')
  revalidatePath('/dashboard')
  revalidatePath('/profile')

  return { coinsAwarded: obj.reward_coins, newBalance }
}

// ============================================================
// RÉCUPÉRER UN COURS PARTAGÉ (lien /cours/[id])
// ============================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Client service-role : permet de lire un cours/des fiches qui n'appartiennent
// pas à l'utilisateur courant (RLS bloquerait sinon), pour les pages publiques
// de partage.
function getPublicClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Copie un cours partagé (toutes ses fiches + ses QCM) dans le compte de
 * l'utilisateur connecté. Idempotent : si l'utilisateur a déjà récupéré ce
 * cours via ce lien, renvoie directement sa copie existante.
 */
export async function claimSharedCourse(
  sharedCourseId: string
): Promise<{ courseId: string | null; error?: string }> {
  if (!UUID_REGEX.test(sharedCourseId)) {
    return { courseId: null, error: 'Identifiant de cours invalide' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { courseId: null, error: 'Non connecté' }

  const publicClient = getPublicClient()

  const { data: sourceCourse } = await publicClient
    .from('courses')
    .select('*')
    .eq('id', sharedCourseId)
    .single()

  if (!sourceCourse) return { courseId: null, error: 'Cours introuvable' }

  // Le partageur ouvre son propre lien : rien à faire
  if (sourceCourse.user_id === user.id) {
    return { courseId: sourceCourse.id }
  }

  // Idempotence : ce cours a-t-il déjà été récupéré par cet utilisateur ?
  const { data: existingClaim } = await supabase
    .from('courses')
    .select('id')
    .eq('user_id', user.id)
    .eq('origin_course_id', sharedCourseId)
    .maybeSingle()

  if (existingClaim) return { courseId: existingClaim.id }

  const { data: sourceFlashcards } = await publicClient
    .from('flashcards')
    .select('*')
    .eq('course_id', sharedCourseId)
    .order('order_index', { ascending: true })

  if (!sourceFlashcards || sourceFlashcards.length === 0) {
    return { courseId: null, error: 'Ce cours ne contient aucune fiche' }
  }

  const { data: sourceQuestions } = await publicClient
    .from('qcm_questions')
    .select('*')
    .eq('course_id', sharedCourseId)

  // 1. Créer la copie du cours pour le destinataire
  const { data: newCourse, error: courseError } = await supabase
    .from('courses')
    .insert({
      user_id: user.id,
      title: sourceCourse.title,
      subject: sourceCourse.subject,
      color: sourceCourse.color,
      source_type: sourceCourse.source_type,
      source_content: sourceCourse.source_content,
      file_url: sourceCourse.file_url,
      status: 'ready',
      progress: 0,
      qcm_status: sourceCourse.qcm_status,
      origin_course_id: sharedCourseId,
    })
    .select('id')
    .single()

  if (courseError || !newCourse) {
    return { courseId: null, error: courseError?.message || 'Erreur lors de la copie du cours' }
  }

  // 2. Dupliquer les fiches (sans la maîtrise, propre à chaque utilisateur)
  const flashcardsToInsert = sourceFlashcards.map((f) => ({
    course_id: newCourse.id,
    user_id: user.id,
    title: f.title,
    summary: f.summary,
    key_points: f.key_points,
    is_mastered: false,
    order_index: f.order_index,
  }))

  const { data: newFlashcards, error: flashcardsError } = await supabase
    .from('flashcards')
    .insert(flashcardsToInsert)
    .select('id, order_index')

  if (flashcardsError || !newFlashcards) {
    await supabase.from('courses').delete().eq('id', newCourse.id)
    return { courseId: null, error: flashcardsError?.message || 'Erreur lors de la copie des fiches' }
  }

  // 3. Dupliquer les QCM en remappant flashcard_id (ancien -> nouveau via order_index)
  if (sourceQuestions && sourceQuestions.length > 0) {
    const sourceIdToOrderIndex = new Map<string, number>()
    sourceFlashcards.forEach((f) => sourceIdToOrderIndex.set(f.id, f.order_index))

    const orderIndexToNewId = new Map<number, string>()
    newFlashcards.forEach((f) => orderIndexToNewId.set(f.order_index, f.id))

    const questionsToInsert = sourceQuestions
      .map((q) => {
        const orderIndex = sourceIdToOrderIndex.get(q.flashcard_id)
        const newFlashcardId = orderIndex !== undefined ? orderIndexToNewId.get(orderIndex) : undefined
        if (!newFlashcardId) return null
        return {
          flashcard_id: newFlashcardId,
          course_id: newCourse.id,
          user_id: user.id,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation,
          difficulty: q.difficulty,
        }
      })
      .filter((q): q is NonNullable<typeof q> => q !== null)

    if (questionsToInsert.length > 0) {
      await supabase.from('qcm_questions').insert(questionsToInsert)
    }
  }

  revalidatePath('/courses')
  revalidatePath('/dashboard')

  return { courseId: newCourse.id }
}

/**
 * Infos minimales sur un cours partagé, pour la page publique /cours/[id].
 * Utilise le client service-role pour contourner la RLS (accès anonyme).
 */
export async function getSharedCourse(courseId: string) {
  if (!UUID_REGEX.test(courseId)) return null

  const publicClient = getPublicClient()

  const { data: course } = await publicClient
    .from('courses')
    .select('id, title, subject, color, qcm_status, user_id')
    .eq('id', courseId)
    .single()

  if (!course) return null

  const { data: flashcards } = await publicClient
    .from('flashcards')
    .select('id, course_id, user_id, title, summary, key_points, is_mastered, order_index, created_at')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (!flashcards || flashcards.length === 0) return null

  return { course, flashcards }
}
