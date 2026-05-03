import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      db:     'ok',
      ts:     new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', db: 'unreachable', ts: new Date().toISOString() },
      { status: 503 }
    )
  }
}
