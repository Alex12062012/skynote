import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const formData = await request.formData()
  const pseudo = (formData.get('pseudo') as string || '').trim().slice(0, 20)

  if (!pseudo) return NextResponse.redirect(new URL('/leaderboard', request.url))

  // Verifier unicite
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('pseudo', pseudo)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.redirect(new URL('/leaderboard?error=pseudo_taken', request.url))
  }

  await supabase
    .from('profiles')
    .update({ pseudo })
    .eq('id', user.id)

  return NextResponse.redirect(new URL('/leaderboard', request.url))
}
