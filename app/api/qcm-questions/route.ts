import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const flashcardId = searchParams.get('flashcardId')
  const difficulty = searchParams.get('difficulty')

  if (!flashcardId) return NextResponse.json({ error: 'flashcardId requis' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let query = supabase
    .from('qcm_questions')
    .select('*')
    .eq('flashcard_id', flashcardId)
    .eq('user_id', user.id)

  if (difficulty) {
    query = query.eq('difficulty', difficulty)
  }

  const { data: questions } = await query

  return NextResponse.json({ questions: questions || [] })
}
