import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ──────────────────────────────────────────────
// Définition des segments de la roue (doit être
// identique à celle du composant client)
// ──────────────────────────────────────────────
export const WHEEL_SEGMENTS = [
  { id: 'lost',      label: 'Perdu',     type: 'lost',     value: 0   },
  { id: 'coins_20',  label: '+20',       type: 'coins',    value: 20  },
  { id: 'coins_40',  label: '+40',       type: 'coins',    value: 40  },
  { id: 'coins_60',  label: '+60',       type: 'coins',    value: 60  },
  { id: 'coins_100', label: '+100',      type: 'coins',    value: 100 },
  { id: 'coins_200', label: '+200',      type: 'coins',    value: 200 },
  { id: 'boost_xp',  label: 'Boost XP', type: 'boost_xp', value: 0   },
  { id: 'frame',     label: 'Cadre',     type: 'frame',    value: 0   },
] as const

// Probabilités cumulatives (doit totaliser 100)
// Perdu: 25% | +20: 20% | +40: 20% | +60: 15% | +100: 10% | +200: 5% | Boost: 3% | Cadre: 2%
const WEIGHTS = [25, 20, 20, 15, 10, 5, 3, 2]
const CUMULATIVE = WEIGHTS.reduce<number[]>((acc, w, i) => {
  acc.push((acc[i - 1] ?? 0) + w)
  return acc
}, [])

const SPIN_COST = 50

function pickSegment(): number {
  const roll = Math.random() * 100
  return CUMULATIVE.findIndex(cum => roll < cum)
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifier le solde
  const { data: profile } = await supabase
    .from('profiles')
    .select('sky_coins')
    .eq('id', user.id)
    .single()

  if (!profile || profile.sky_coins < SPIN_COST) {
    return NextResponse.json({ error: 'Pas assez de Sky Coins' }, { status: 400 })
  }

  const segIndex = pickSegment()
  const segment = WHEEL_SEGMENTS[segIndex]
  const netGain = segment.value - SPIN_COST

  // Déduire le coût
  const { error: deductErr } = await supabase.rpc('increment_coins', {
    p_user_id: user.id,
    p_amount: -SPIN_COST,
  })
  if (deductErr) return NextResponse.json({ error: 'Erreur de déduction' }, { status: 500 })

  // Appliquer la récompense
  if (segment.type === 'coins' && segment.value > 0) {
    await supabase.rpc('increment_coins', { p_user_id: user.id, p_amount: segment.value })
  }

  if (segment.type === 'boost_xp') {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1h
    await supabase.from('user_inventory').upsert({
      user_id: user.id,
      item_type: 'boost_xp',
      item_id: 'xp_x2',
      data: { multiplier: 2 },
      expires_at: expiresAt,
    }, { onConflict: 'user_id,item_type,item_id' })
  }

  if (segment.type === 'frame') {
    const frameId = `frame_rare_${Date.now()}`
    await supabase.from('user_inventory').insert({
      user_id: user.id,
      item_type: 'frame',
      item_id: frameId,
      data: { name: 'Cadre Étoile', rarity: 'rare' },
    })
  }

  // Enregistrer le spin
  await supabase.from('wheel_spins').insert({
    user_id: user.id,
    segment_id: segment.id,
    reward_type: segment.type === 'lost' ? 'lost' : segment.type,
    reward_value: segment.value,
    cost: SPIN_COST,
    net_gain: netGain,
  })

  return NextResponse.json({
    segmentIndex: segIndex,
    segment,
    netGain,
    newBalance: profile.sky_coins + netGain,
  })
}
