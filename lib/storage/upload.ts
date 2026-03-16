import { createClient } from '@/lib/supabase/server'

export async function uploadCourseFile(file: File, userId: string): Promise<string | null> {
  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('course-files').upload(path, file, { upsert: false, contentType: file.type })
  if (error) { console.error('[upload]', error); return null }
  const { data } = supabase.storage.from('course-files').getPublicUrl(path)
  return data.publicUrl
}
