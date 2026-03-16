import { createClient } from './server'
import type { Course, Flashcard, Profile, QcmQuestion } from '@/types/database'

export async function getUserCourses(userId: string): Promise<Course[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}
export async function getCourse(courseId: string, userId: string): Promise<Course | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('id', courseId).eq('user_id', userId).single()
  return data ?? null
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
