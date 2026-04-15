'use server'
import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import { canCreateCourse, incrementWeeklyCourseCount } from './plan'

export async function createCourse(formData: FormData): Promise<{ courseId: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { courseId: null, error: 'Non connecté' }

  const title = formData.get('title') as string
  const subject = formData.get('subject') as string
  const sourceType = formData.get('sourceType') as 'text' | 'pdf' | 'photo' | 'vocal'
  const content = formData.get('content') as string | null
  const folderId = formData.get('folderId') as string | null
  const classroomId = formData.get('classroomId') as string | null

  if (!title?.trim()) return { courseId: null, error: 'Titre requis' }
  if (!subject?.trim()) return { courseId: null, error: 'Matière requise' }

  // Vérifier la limite hebdomadaire
  const limit = await canCreateCourse(user.id)
  if (!limit.allowed) {
    const resetDate = limit.resetAt ? new Date(limit.resetAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'lundi'
    return { courseId: null, error: `LIMIT:Tu as utilisé tes ${limit.coursesMax} cours cette semaine. Renouvellement le ${resetDate}.` }
  }

  const subjectColors: Record<string, string> = {
    Mathématiques: '#2563EB', Français: '#BE185D', Histoire: '#92400E', Géographie: '#065F46',
    SVT: '#059669', Physique: '#5B21B6', Chimie: '#7C3AED', Anglais: '#C2410C',
    Espagnol: '#DC2626', Philosophie: '#4338CA', Général: '#2563EB',
  }

  const folderId = formData.get('folderId') as string | null
  const classroomId = formData.get('classroomId') as string | null

  const { data: course, error } = await supabase.from('courses').insert({
    user_id: user.id, title: title.trim(), subject: subject.trim(),
    color: subjectColors[subject] || '#2563EB', source_type: sourceType,
    source_content: content?.trim() || null, file_url: null,
    status: 'processing', progress: 0,
    folder_id: folderId || null, classroom_id: classroomId || null,
  }).select('id').single()

  if (error || !course) return { courseId: null, error: `Erreur création cours: ${error?.message || error?.code || 'inconnue'}` }
  // Incrémenter le compteur hebdomadaire
  await incrementWeeklyCourseCount(user.id)
  revalidatePath('/courses')
  revalidatePath('/dashboard')
  return { courseId: course.id, error: null }
}

export async function updateCourseTitle(courseId: string, newTitle: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }
  if (!newTitle?.trim()) return { error: 'Titre requis' }
  const { error } = await supabase.from('courses').update({ title: newTitle.trim() }).eq('id', courseId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath(`/courses/${courseId}`)
  revalidatePath('/courses')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteCourse(courseId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }
  const { error } = await supabase.from('courses').delete().eq('id', courseId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/courses'); revalidatePath('/dashboard')
  return { error: null }
}

export async function toggleFlashcardMastered(flashcardId: string, isMastered: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }
  await supabase.from('flashcards').update({ is_mastered: isMastered }).eq('id', flashcardId).eq('user_id', user.id)
  const { data: flashcard } = await supabase.from('flashcards').select('course_id').eq('id', flashcardId).single()
  if (flashcard) {
    const { data: all } =