import { cache } from 'react'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasSupabaseSessionCookie } from './session-cookie'

/**
 * `supabase.auth.getUser()` memoise par requete (React.cache) : layout, page,
 * generateMetadata et helpers appellent tous getUser — chacun etait un
 * aller-retour reseau vers Supabase Auth. Un seul suffit par rendu.
 */
export const getCachedUser = cache(async () => {
  const cookieStore = await cookies()
  if (!hasSupabaseSessionCookie(cookieStore.getAll())) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}
