import { createClient } from './server'
import type { Course, Flashcard, Profile, QcmQuestion } from '@/types/database'

export async function getUserCourses(userId: string): Promise<Course[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}

/** Récupère le teacher_id à partir du profil d'un élève */
export async function getTeacherIdForStudent(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('role, classroom_id').eq('id', userId).single()
  if (profile?.role !== 'student' || !profile.classroom_id) return null
  const { data: classroom } = await supabase.from('classrooms').select('teacher_id').eq('id', profile.classroom_id).single()
  return classroom?.teacher_id ?? null
}

/** Récupère les cours du prof pour un élève */
export async function getTeacherCourses(studentUserId: string): Promise<Course[]> {
  const teacherId = await getTeacherIdForStudent(studentUserId)
  if (!teacherId) return []
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('user_id', teacherId).eq('status', 'ready').order('created_at', { ascending: false })
  return data || []
}

export async function getCourse(courseId: string, userId: string): Promise<Course | null> {
  const supabase = await createClient()
  // D'abord essayer en tant que propriétaire
  const { data } = await supabase.from('courses').select('*').eq('id', courseId).eq('user_id', userId).single()
  if (data) return data
  // Sinon, vérifier si c'est un élève qui accède au cours de son prof
  const teacherId = await getTeacherIdForStudent(userId)
  if (teacherId) {
    const { data: teacherCourse } = await supabase.from('courses').select('*').eq('id', courseId).eq('user_id', teacherId).single()
    return teacherCourse ?? null
  }
  return null
}
export async function getCourseFlashcards(courseId: string): Promise<Flashcard[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('flashcards').select('*').eq('course_id', courseId).order('order_index', { ascending: true })
  return data || []
}
export async function getFlashcardQcm(flashcardId: string): Promise<QcmQuestion[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('qcm_questions').select('*').eq('flashcard_id', flashcardId)
  return data || []
}
export async function getDashboardStats(userId: string) {
  const supabase = await createClient()
  const [coursesRes, attemptsRes] = await Promise.all([
    supabase.from('courses').select('id,title,subject,color,progress,status,created_at,source_type').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('qcm_attempts').select('score,total,perfect,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
  ])
  return { recentCourses: coursesRes.data || [], recentAttempts: attemptsRes.data || [] }
}
export async function getProfileWithCoins(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data ?? null
}
