'use server'
import { createClient } from './server'
import { revalidatePath } from 'next/cache'

export async function createCourse(formData: FormData): Promise<{ courseId: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { courseId: null, error: 'Non connecté' }

  const title = formData.get('title') as string
  const subject = formData.get('subject') as string
  const sourceType = formData.get('sourceType') as 'text' | 'pdf' | 'photo' | 'vocal'
  const content = formData.get('content') as string | null

  if (!title?.trim()) return { courseId: null, error: 'Titre requis' }
  if (!subject?.trim()) return { courseId: null, error: 'Matière requise' }

  const subjectColors: Record<string, string> = {
    Mathématiques: '#2563EB', Français: '#BE185D', Histoire: '#92400E', Géographie: '#065F46',
    SVT: '#059669', Physique: '#5B21B6', Chimie: '#7C3AED', Anglais: '#C2410C',
    Espagnol: '#DC2626', Philosophie: '#4338CA', Général: '#2563EB',
  }

  const { data: course, error } = await supabase.from('courses').insert({
    user_id: user.id, title: title.trim(), subject: subject.trim(),
    color: subjectColors[subject] || '#2563EB', source_type: sourceType,
    source_content: content?.trim() || null, file_url: null,
    status: 'processing', progress: 0,
  }).select('id').single()

  if (error || !course) return { courseId: null, error: 'Erreur création cours' }
  revalidatePath('/courses')
  revalidatePath('/dashboard')
  return { courseId: course.id, error: null }
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
    const { data: all } = await supabase.from('flashcards').select('is_mastered').eq('course_id', flashcard.course_id)
    if (all) {
      const progress = Math.round((all.filter((f) => f.is_mastered).length / all.length) * 100)
      await supabase.from('courses').update({ progress }).eq('id', flashcard.course_id)
    }
  }
  revalidatePath('/courses')
  return { error: null }
}
