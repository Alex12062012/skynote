import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REGULAR_SKIN_IDS, SECRET_SKIN_IDS, SKINS } from '@/lib/gamification/config'

// ──────────────────────────────────────────────────────────────────────────────
// Segments visibles (affichés dans SpinWheel.tsx)
// + 1 segment secret "skin_secret" non affiché dans l'UI
// Total poids = 100
// ──────────────────────────────────────────────────────────────────────────────
const WHEEL_SEGMENTS = [
  { id: 'lost',        label: 'Perdu',      type: 'lost',        value: 0   },
  { id: 'coins_20',   label: '+20',         type: 'coins',       value: 20  },
  { id: 'coins_40',   label: '+40',         type: 'coins',       value: 40  },
  { id: 'coins_60',   label: '+60',         type: 'coins',       value: 60  },
  { id: 'coins_100',  label: '+100',        type: 'coins',       value: 100 },
  { id: 'coins_200',  label: '+200',        type: 'coins',       value: 200 },
  { id: 'boost_xp',  label: 'Boost XP',    type: 'boost_xp',    value: 0   },
  { id: 'skin',       label: 'Skin',        type: 'skin',        value: 0   },
  { id: 'skin_secret', label: '???',        type: 'skin_secret', value: 0   }, // caché dans l'UI
] as const

// Perdu:20 | +20:16 | +40:13 | +60:18 | +100:13 | +200:7 | Boost:4 | Skin:5 | Secret:4 = 100
const WEIGHTS = [20, 16, 13, 18, 13, 7, 4, 5, 4]
const CUMULATIVE = WEIGHTS.reduce<number[]>((acc, w, i) => {
  acc.push((acc[i - 1] ?? 0) + w)
  return acc
}, [])

const SPIN_COST = 50

function pickSegment(): number {
  const roll = Math.random() * 100
  return CUMULATIVE.findIndex(cum => roll < cum)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('sky_coins').eq('id', user.id).single()

  if (!profile || profile.sky_coins < SPIN_COST) {
    return NextResponse.json({ error: 'Pas assez de Sky Coins' }, { status: 400 })
  }

  const segIndex = pickSegment()
  const segment = WHEEL_SEGMENTS[segIndex]
  const netGain = 'value' in segment ? (segment as any).value - SPIN_COST : -SPIN_COST

  // Déduire le coût
  const { error: deductErr } = await supabase.rpc('increment_coins', {
    p_user_id: user.id,
    p_amount: -SPIN_COST,
  })
  if (deductErr) return NextResponse.json({ error: 'Erreur de déduction' }, { status: 500 })

  // Appliquer la récompense
  if (segment.type === 'coins' && (segment as any).value > 0) {
    await supabase.rpc('increment_coins', { p_user_id: user.id, p_amount: (segment as any).value })
  }

  if (segment.type === 'boost_xp') {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await supabase.from('user_inventory').upsert({
      user_id: user.id, item_type: 'boost_xp', item_id: 'xp_x2',
      data: { multiplier: 2 }, expires_at: expiresAt,
    }, { onConflict: 'user_id,item_type,item_id' })
  }

  let wonSkinId: string | null = null

  if (segment.type === 'skin') {
    // Skin normal : tirer aléatoirement parmi les 10 normaux
    wonSkinId = pickRandom(REGULAR_SKIN_IDS)
    const skinEntry = SKINS.find(s => s.id === wonSkinId)
    await supabase.from('user_inventory').upsert({
      user_id: user.id, item_type: 'frame', item_id: wonSkinId,
      data: { name: skinEntry?.label ?? 'Skin', rarity: skinEntry?.rarity ?? 'rare', secret: false },
    }, { onConflict: 'user_id,item_type,item_id' })
  }

  if (segment.type === 'skin_secret') {
    // Skin secret : tirer parmi les 5 secrets
    wonSkinId = pickRandom(SECRET_SKIN_IDS)
    const skinEntry = SKINS.find(s => s.id === wonSkinId)
    await supabase.from('user_inventory').upsert({
      user_id: user.id, item_type: 'frame', item_id: wonSkinId,
      data: { name: skinEntry?.label ?? 'Skin Secret', rarity: 'legendary', secret: true },
    }, { onConflict: 'user_id,item_type,item_id' })
  }

  // Incrémenter le compteur de tours (via RPC SECURITY DEFINER — fiable côté API route)
  await supabase.rpc('increment_wheel_spins', { p_user_id: user.id })

  // Enregistrer le spin dans les logs (best-effort, peut échouer silencieusement)
  await supabase.from('wheel_spins').insert({
    user_id: user.id,
    segment_id: segment.id,
    reward_type: ['skin', 'skin_secret'].includes(segment.type) ? 'frame' : (segment.type === 'lost' ? 'lost' : segment.type),
    reward_value: 0,
    cost: SPIN_COST,
    net_gain: netGain,
  })

  // On renvoie 'skin' pour les deux types (l'UI ne sait pas si c'est secret)
  const responseSegment = segment.type === 'skin_secret'
    ? { ...segment, id: 'skin', type: 'skin', label: 'Skin' }
    : segment

  return NextResponse.json({
    segmentIndex: ['skin', 'skin_secret'].includes(segment.type)
      ? WHEEL_SEGMENTS.findIndex(s => s.id === 'skin') // pointer vers le slot skin visible
      : segIndex,
    segment: responseSegment,
    wonSkinId,
    netGain,
    newBalance: profile.sky_coins + netGain,
  })
}
