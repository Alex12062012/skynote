import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Vérification d'identité admin pour les routes /api/admin/*.
 *
 * Chaque méthode doit l'appeler : l'écran d'admin n'est pas une protection,
 * une route reste appelable directement. Si ADMIN_EMAILS n'est pas configurée,
 * personne n'est admin — jamais l'inverse.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: 'Non autorise' }, { status: 401 }) }
  }
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return { ok: false as const, res: NextResponse.json({ error: 'Acces refuse' }, { status: 403 }) }
  }
  return { ok: true as const, userId: user.id }
}
