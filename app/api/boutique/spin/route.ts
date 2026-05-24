import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REGULAR_SKIN_IDS, SECRET_SKIN_IDS, SKINS } from '@/lib/gamification/config'

// Segments visibles + 1 secret non affiche dans l'UI
// Total poids = 100
const WHEEL_SEGMENTS = [
  { id: 'lost',        label: 'Perdu',      type: 'lost'        as const, value: 0   },
  { id: 'coins_20',    label: '+20',        type: 'coins'       as const, value: 20  },
  { id: 'coins_40',    label: '+40',        type: 'coins'       as const, value: 40  },
  { id: 'coins_60',    label: '+60',        type: 'coins'       as const, value: 60  },
  { id: 'coins_100',   label: '+100',       type: 'coins'       as const, value: 100 },
  { id: 'coins_200',   label: '+200',       type: 'coins'       as const, value: 200 },
  { id: 'boost_xp',   label: 'Boost XP',   type: 'boost_xp'   as const, value: 0   },
  { id: 'skin',        label: 'Skin',       type: 'skin'        as const, value: 0   },
  { id: 'skin_secret', label: '???',        type: 'skin_secret' as const, value: 0   },
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
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('sky_coins').eq('id', user.id).single()

  if (!profile || profile.sky_coins < SPIN_COST) {
    return NextResponse.json({ error: 'Pas assez de Sky Coins' }, { status: 400 })
  }

  const segIndex = pickSegment()
  const segment = WHEEL_SEGMENTS[segIndex]
  const coinValue = 'value' in segment ? (segment as any).value : 0
  const netGain = coinValue - SPIN_COST

  // Deduire le cout
  const { error: deductErr } = await supabase.rpc('increment_coins', {
    p_user_id: user.id,
    p_amount: -SPIN_COST,
  })
  if (deductErr) return NextResponse.json({ error: 'Erreur de deduction' }, { status: 500 })

  // Appliquer la recompense selon le type
  if (segment.type === 'coins' && coinValue > 0) {
    const { error } = await supabase.rpc('increment_coins', { p_user_id: user.id, p_amount: coinValue })
    if (error) console.error('[spin] increment_coins error:', error)
  }

  if (segment.type === 'boost_xp') {
    // Ecrire dans user_boosts — table lue par layout.tsx pour appliquer le multiplicateur
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('user_boosts').upsert({
      user_id:    user.id,
      boost_type: 'x2_coins',
      expires_at: expiresAt,
    }, { onConflict: 'user_id,boost_type' })
    if (error) console.error('[spin] user_boosts upsert error:', error)
  }

  let wonSkinId: string | null = null

  if (segment.type === 'skin') {
    wonSkinId = pickRandom(REGULAR_SKIN_IDS)
    const skinEntry = SKINS.find(s => s.id === wonSkinId)
    const { error } = await supabase.from('user_inventory').upsert({
      user_id:   user.id,
      item_type: 'frame',
      item_id:   wonSkinId,
      data: { name: skinEntry?.label ?? 'Skin', rarity: skinEntry?.rarity ?? 'rare', secret: false },
    }, { onConflict: 'user_id,item_type,item_id' })
    if (error) console.error('[spin] user_inventory skin upsert error:', error)
  }

  if (segment.type === 'skin_secret') {
    wonSkinId = pickRandom(SECRET_SKIN_IDS)
    const skinEntry = SKINS.find(s => s.id === wonSkinId)
    const { error } = await supabase.from('user_inventory').upsert({
      user_id:   user.id,
      item_type: 'frame',
      item_id:   wonSkinId,
      data: { name: skinEntry?.label ?? 'Skin Secret', rarity: 'legendary', secret: true },
    }, { onConflict: 'user_id,item_type,item_id' })
    if (error) console.error('[spin] user_inventory skin_secret upsert error:', error)
  }

  // Incrementer le compteur de tours
  await supabase.rpc('increment_wheel_spins', { p_user_id: user.id })

  // Logger le spin (best-effort)
  await supabase.from('wheel_spins').insert({
    user_id:      user.id,
    segment_id:   segment.id,
    reward_type:  ['skin', 'skin_secret'].includes(segment.type) ? 'frame'
                : segment.type === 'lost' ? 'lost'
                : segment.type === 'boost_xp' ? 'boost'
                : 'coins',
    reward_value: coinValue,
    cost:         SPIN_COST,
    net_gain:     netGain,
  }).then(({ error }) => { if (error) console.error('[spin] wheel_spins insert error:', error) })

  // Renvoyer 'skin' pour les deux types skin (l'UI ne distingue pas)
  const responseSegment = segment.type === 'skin_secret'
    ? { ...segment, id: 'skin', type: 'skin', label: 'Skin' }
    : segment

  return NextResponse.json({
    segmentIndex: ['skin', 'skin_secret'].includes(segment.type)
      ? WHEEL_SEGMENTS.findIndex(s => s.id === 'skin')
      : segIndex,
    segment: responseSegment,
    wonSkinId,
    netGain,
    newBalance: profile.sky_coins + netGain,
  })
}
