import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const { classroomId, skycoinsEnabled, skycoinsInRanking } = await req.json()

    // Verifier que le user est owner
    const { data: classroom } = await supabase
      .from('classrooms')
      .select('id')
      .eq('id', classroomId)
      .eq('teacher_id', user.id)
      .single()

    if (!classroom) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
    }

    const { error } = await supabase
      .from('classroom_settings')
      .update({
        skycoins_enabled: skycoinsEnabled,
        skycoins_in_ranking: skycoinsInRanking,
      })
      .eq('classroom_id', classroomId)

    if (error) return NextResponse.json({ error: 'Erreur mise a jour' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}