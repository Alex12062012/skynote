import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(c: any[]) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Vérifier si le mode beta est actif
        const { data: betaSetting } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'beta_mode')
          .single()
        const isBeta = betaSetting?.value === 'true'

        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          plan: 'free',
          sky_coins: 0,
          streak_days: 0,
          last_login_at: new Date().toISOString(),
          is_beta_tester: isBeta,
          role: user.user_metadata?.role === 'teacher' ? 'teacher' : 'user',
        }, { onConflict: 'id', ignoreDuplicates: true })
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
