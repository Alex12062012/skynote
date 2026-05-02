import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Comptes de démonstration — session limitée à 2h pour éviter la persistance entre visiteurs
const DEMO_EMAILS = new Set([
  'demo-teacher@skynote.app',
  'demo-student@skynote.app',
  'demo-skynote@tutamail.com',
])
const DEMO_SESSION_TTL_MS = 2 * 60 * 60 * 1000 // 2 heures

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
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  // ── Sécurité session demo ──────────────────────────────────────────────────
  // Si l'utilisateur connecté est un compte demo, on vérifie que la session
  // a bien été initiée par le formulaire demo ET qu'elle n'a pas dépassé 2h.
  // Sinon on force une déconnexion pour éviter que le prochain visiteur
  // hérite d'une session persistante.
  if (user && DEMO_EMAILS.has(user.email ?? '')) {
    const demoSessionAt = request.cookies.get('demo_session_at')?.value
    const sessionStart = demoSessionAt ? parseInt(demoSessionAt, 10) : 0
    const isExpired = !demoSessionAt || isNaN(sessionStart) || Date.now() - sessionStart > DEMO_SESSION_TTL_MS

    if (isExpired) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/demo-login'
      url.searchParams.set('expired', '1')
      const redirectRes = NextResponse.redirect(url)
      // Supprime le cookie de marquage
      redirectRes.cookies.delete('demo_session_at')
      return redirectRes
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const protectedPaths = ['/dashboard', '/courses', '/objectives', '/profile']
  const authPaths = ['/login', '/signup', '/signup-teacher', '/classroom-login', '/demo-login']
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))
  const isAuth = authPaths.some((p) => request.nextUrl.pathname.startsWith(p))
  if (isProtected && !user) {
    const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url)
  }
  if (isAuth && user) {
    const url = request.nextUrl.clone(); url.pathname = '/dashboard'; return NextResponse.redirect(url)
  }
  return supabaseResponse
}
