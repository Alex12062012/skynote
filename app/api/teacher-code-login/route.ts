import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Format du code prof : PROF + user_number (ex: PROF0042 ou PROF123)
function parseTeacherCode(raw: string): number | null {
  const clean = raw.trim().toUpperCase().replace(/\s/g, '')
  const match = clean.match(/^PROF0*(\d+)$/)
  if (!match) return null
  const num = parseInt(match[1], 10)
  return isNaN(num) ? null : num
}

export async function POST(req: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { teacherCode } = await req.json() as { teacherCode: string }

    if (!teacherCode || typeof teacherCode !== 'string') {
      return NextResponse.json({ error: 'Code professeur requis' }, { status: 400 })
    }

    const userNumber = parseTeacherCode(teacherCode)
    if (userNumber === null) {
      return NextResponse.json({ error: 'Format de code invalide. Exemple : PROF0042' }, { status: 400 })
    }

    // Trouver le profil professeur correspondant
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('user_number', userNumber)
      .eq('role', 'teacher')
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Code invalide. Verifie ton code professeur.' }, { status: 404 })
    }

    // Utiliser l'origin de la requête pour que ca marche en local ET en prod
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || process.env.NEXT_PUBLIC_SITE_URL || 'https://skynote.fr'
    const siteOrigin = origin.startsWith('http') ? new URL(origin).origin : origin

    // Generer un lien de connexion magique (sans envoyer d'email)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: {
        redirectTo: `${siteOrigin}/auth/callback?next=/dashboard`,
      },
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('generateLink error:', linkError)
      return NextResponse.json({ error: 'Erreur lors de la generation du lien de connexion' }, { status: 500 })
    }

    // Retourner le token et l'email pour verifyOtp côté client (evite le problème PKCE)
    return NextResponse.json({
      success: true,
      token: linkData.properties.hashed_token,
      email: profile.email,
      teacherName: profile.full_name || 'Professeur',
    })
  } catch (e) {
    console.error('teacher-code-login error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
