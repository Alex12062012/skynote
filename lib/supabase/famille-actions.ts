'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

// ============================================================
// CRÉER UN GROUPE FAMILLE
// ============================================================

export async function createFamilleGroup(name: string): Promise<{
  groupId: string | null
  familyCode: string | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { groupId: null, familyCode: null, error: 'Non connecté' }

  // Vérifier que l'utilisateur est bien en plan famille
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  // Générer un code famille unique
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'FAM-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]

  const { data: group, error } = await supabase
    .from('famille_groups')
    .insert({ parent_id: user.id, family_code: code, name })
    .select('id, family_code')
    .single()

  if (error) return { groupId: null, familyCode: null, error: error.message }

  revalidatePath('/famille')
  return { groupId: group.id, familyCode: group.family_code, error: null }
}

// ============================================================
// AJOUTER UN ENFANT
// ============================================================

export async function addChildAccount(
  familleId: string,
  pseudo: string
): Promise<{ childId: string | null; accessCode: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { childId: null, accessCode: null, error: 'Non connecté' }

  // Vérifier le nombre d'enfants (max 6)
  const { count } = await supabase
    .from('child_accounts')
    .select('id', { count: 'exact' })
    .eq('famille_id', familleId)

  if ((count ?? 0) >= 6) return { childId: null, accessCode: null, error: 'Maximum 6 enfants atteint' }

  // Générer un code d'accès à 4 chiffres
  const accessCode = String(Math.floor(1000 + Math.random() * 9000))

  const { data: child, error } = await supabase
    .from('child_accounts')
    .insert({
      famille_id: familleId,
      parent_id: user.id,
      pseudo: pseudo.trim(),
      access_code: accessCode,
    })
    .select('id')
    .single()

  if (error) return { childId: null, accessCode: null, error: error.message }

  revalidatePath('/famille')
  return { childId: child.id, accessCode, error: null }
}

// ============================================================
// SUPPRIMER UN ENFANT
// ============================================================

export async function removeChildAccount(childId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }

  await supabase
    .from('child_accounts')
    .delete()
    .eq('id', childId)
    .eq('parent_id', user.id)

  revalidatePath('/famille')
  return { error: null }
}

// ============================================================
// RÉCUPÉRER LES STATS DES ENFANTS
// ============================================================

export async function getFamilleStats(parentId: string) {
  const supabase = await createClient()

  const { data: group } = await supabase
    .from('famille_groups')
    .select('*')
    .eq('parent_id', parentId)
    .single()

  if (!group) return { group: null, children: [] }

  const { data: children } = await supabase
    .from('child_accounts')
    .select('*, child_stats(*)')
    .eq('famille_id', group.id)
    .order('created_at')

  return { group, children: children || [] }
}

// ============================================================
// CALCULER LE TALENT DOMINANT D'UN ENFANT
// ============================================================

export function calculateTalent(stats: any[]): { subject: string; score: number } | null {
  if (!stats || stats.length === 0) return null

  let best = null
  let bestScore = -1

  for (const s of stats) {
    if (s.qcm_count === 0) continue
    // Score = taux de réussite × (1 + log du nombre de cours)
    const successRate = s.qcm_perfect / s.qcm_count
    const volumeBonus = 1 + Math.log(s.courses_count + 1) * 0.3
    const score = successRate * volumeBonus * 100

    if (score > bestScore) {
      bestScore = score
      best = { subject: s.subject, score: Math.round(score) }
    }
  }

  return best
}
