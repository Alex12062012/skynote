import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const pseudo = (body?.pseudo || '').trim().slice(0, 20)

  if (!pseudo) return NextResponse.json({ error: 'Pseudo requis' }, { status: 400 })

  const sanitized = pseudo.replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '').slice(0, 20)
  if (!sanitized || sanitized.length < 2) {
    return NextResponse.json({ error: 'Pseudo invalide (2-20 caracteres)' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('pseudo', sanitized)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ce pseudo est deja pris' }, { status: 409 })
  }

  await supabase.from('profiles').update({ pseudo: sanitized }).eq('id', user.id)

  return NextResponse.json({ ok: true, pseudo: sanitized })
}