import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

async function verifyAdmin(): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { isAdmin: false, error: NextResponse.json({ error: 'Non autorise' }, { status: 401 }) }
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return { isAdmin: false, error: NextResponse.json({ error: 'Acces refuse' }, { status: 403 }) }
  }
  return { isAdmin: true }
}

export async function GET() {
  const { isAdmin, error } = await verifyAdmin()
  if (!isAdmin) return error!
  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('admin_settings').select('value').eq('key', 'beta_mode').single()
  return NextResponse.json({ enabled: data?.value === 'true' })
}

export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin()
  if (!isAdmin) return error!
  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { enabled } = await request.json()
  await supabase.from('admin_settings').upsert({ key: 'beta_mode', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
  return NextResponse.json({ ok: true, enabled })
}
