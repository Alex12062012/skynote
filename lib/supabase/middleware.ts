import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const DEMO_EMAILS = new Set([
  'demo-skynote@tutamail.com',
])
const DEMO_SESSION_TTL_MS = 2 * 60 * 60 * 1000

// Timeout pour l'appel Supabase - evite que le middleware bloque indefiniment
// si Supabase est lent ou indisponible (cause principale des intermittences 504).
const AUTH_TIMEOUT_MS = 4000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Supabase auth timeout after ${ms}ms`)), ms)
    ),
  ])
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Auth check avec timeout - evite un hang si Supabase est lent.
  // Sans ce guard, une erreur reseau fait tomber TOUTES les pages en 500/504.
  let user: { email?: string | null } | null = null
  try {
    const result = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS)
    user = result.data.user
  } catch (err) {
    console.error('[middleware] supabase.auth.getUser() failed:', err)
    const isProtected = ['/dashboard', '/courses', '/objectives', '/profile'].some(
      (p) => request.nextUrl.pathname.startsWith(p)
    )
    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'session_unavailable')
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Securite session demo - limite a 2h
  if (user && DEMO_EMAILS.has(user.email ?? '')) {
    const demoSessionAt = request.cookies.get('demo_session_at')?.value
    const sessionStart = demoSessionAt ? parseInt(demoSessionAt, 10) : 0
    const isExpired =
      !demoSessionAt || isNaN(sessionStart) || Date.now() - sessionStart > DEMO_SESSION_TTL_MS

    if (isExpired) {
      try {
        await withTimeout(supabase.auth.signOut(), AUTH_TIMEOUT_MS)
      } catch (_e) {
        // signOut peut echouer si Supabase est lent - on redirige quand meme
      }
      const url = request.nextUrl.clone()
      url.pathname = '/demo-login'
      url.searchParams.set('expired', '1')
      const redirectRes = NextResponse.redirect(url)
      redirectRes.cookies.delete('demo_session_at')
      return redirectRes
    }
  }

  const protectedPaths = ['/dashboard', '/courses', '/objectives', '/profile']
  const authPaths = ['/login', '/signup', '/demo-login']
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))
  const isAuth = authPaths.some((p) => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  if (isAuth && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  return supabaseResponse
}
