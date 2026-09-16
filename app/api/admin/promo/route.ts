import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/admin-auth'

/**
 * Administration des codes promo.
 *
 * Chaque méthode revérifie l'identité admin côté serveur. On ne se repose
 * jamais sur le fait que l'interface d'admin ne soit pas accessible : une
 * route reste appelable directement, l'écran n'est pas une protection.
 */

const FORMAT_CODE = /^[A-Z0-9-]{4,32}$/

/** Liste les codes et leur consommation. */
export async function GET() {
  const auth = await verifyAdmin()
  if (!auth.ok) return auth.res

  const { data, error } = await createAdminClient()
    .from('promo_codes')
    .select('id, code, label, bonus_novas, starter_month, pro_month, max_uses, uses_count, expires_at, active, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ codes: data ?? [] })
}

/** Crée un code. */
export async function POST(req: NextRequest) {
  const auth = await verifyAdmin()
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const code = String(body.code ?? '').trim().toUpperCase()
  if (!FORMAT_CODE.test(code)) {
    return NextResponse.json(
      { error: 'Le code doit faire 4 à 32 caracteres : lettres, chiffres et tirets.' },
      { status: 400 }
    )
  }

  // Bornes revalidées ici en plus des CHECK SQL : une erreur de saisie doit
  // renvoyer un message clair, pas une violation de contrainte Postgres.
  const entier = (v: unknown, max: number) => {
    const n = Math.floor(Number(v ?? 0))
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null
  }

  const bonusNovas   = entier(body.bonus_novas, 100000)
  const starterMonth = entier(body.starter_month, 24)
  const proMonth     = entier(body.pro_month, 24)
  const maxUses      = entier(body.max_uses, 100000)

  if (bonusNovas === null || starterMonth === null || proMonth === null || maxUses === null) {
    return NextResponse.json({ error: 'Valeurs hors bornes.' }, { status: 400 })
  }
  if (maxUses < 1) {
    return NextResponse.json({ error: 'Le nombre d\'utilisations doit valoir au moins 1.' }, { status: 400 })
  }
  if (bonusNovas === 0 && starterMonth === 0 && proMonth === 0) {
    return NextResponse.json({ error: 'Le code doit accorder au moins une chose.' }, { status: 400 })
  }

  let expiresAt: string | null = null
  if (body.expires_at) {
    const d = new Date(body.expires_at)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Date d\'expiration invalide.' }, { status: 400 })
    }
    expiresAt = d.toISOString()
  }

  const { data, error } = await createAdminClient()
    .from('promo_codes')
    .insert({
      code,
      label: String(body.label ?? '').slice(0, 120) || null,
      bonus_novas: bonusNovas,
      starter_month: starterMonth,
      pro_month: proMonth,
      max_uses: maxUses,
      expires_at: expiresAt,
      created_by: auth.userId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ce code existe deja.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ code: data })
}

/**
 * Active ou désactive un code.
 * On ne supprime jamais : la piste d'audit des utilisations doit survivre.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdmin()
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '')
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const { error } = await createAdminClient()
    .from('promo_codes')
    .update({ active: Boolean(body.active) })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
