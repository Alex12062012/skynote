import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { claimSharedCourse } from '@/lib/supabase/claim-actions'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const shared = searchParams.get('shared')
  const fiche = searchParams.get('fiche')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Connexion via un lien de cours partagé : on récupère automatiquement
      // ce cours (+ ses fiches et QCM) dans le nouveau compte, puis on ouvre
      // directement le QCM correspondant si demandé.
      if (shared) {
        const claim = await claimSharedCourse(shared)
        if (claim.courseId) {
          const target = fiche !== null
            ? `/courses/${claim.courseId}/qcm?fiche=${fiche}`
            : `/courses/${claim.courseId}`
          return NextResponse.redirect(`${origin}${target}`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
