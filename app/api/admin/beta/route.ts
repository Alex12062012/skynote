import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'beta_mode')
    .single()
  return NextResponse.json({ enabled: data?.value === 'true' })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { enabled } = await request.json()
  await supabase
    .from('admin_settings')
    .upsert({ key: 'beta_mode', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
  return NextResponse.json({ ok: true, enabled })
}
