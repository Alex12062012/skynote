/**
 * NOVA ACTIONS — gestion des crédits IA (Novas ✦)
 *
 * Coûts par action :
 *   OCR (1 photo)        :  2 ✦  — NOVA_COST_OCR
 *   Fiches (batch)       : 30 ✦  — NOVA_COST_FICHES
 *   QCM (batch)          : 88 ✦  — NOVA_COST_QCM_BATCH
 *   QCM (1 regen)        :  4 ✦  — NOVA_COST_QCM_SINGLE
 *   Chat (1 msg)         : 36 ✦  — NOVA_COST_CHAT (corrigé : envoie le cours complet à chaque message, sous-évalué à 12✦)
 *   Plan de révision IA  :  5 ✦  — NOVA_COST_EVAL_PLAN
 *   Épreuve brevet/bac   : 200 ✦  — NOVA_COST_EXAM_SIMULATION (génération annales + correction IA, tout inclus)
 *
 * Allocation mensuelle :
 *   free    : 600 ✦ une seule fois
 *   starter : 2 000 ✦/mois
 *   pro     : 4 000 ✦/mois
 *
 * Quota épreuves brevet (en plus du coût Novas ci-dessus) :
 *   free    : 1 tentative à vie — résultat/mention verrouillé (doit passer en Starter pour voir)
 *   starter : 1 tentative à vie — résultat visible
 *   pro     : "illimité" affiché, mais cap doux à 10 sessions à vie
 *             → au-delà : message "serveurs surchargés" (pas de blocage hard, juste UX soft)
 */

import { createClient } from './server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// ─── CONSTANTES (re-exportées depuis nova-constants pour compat back-compat) ─
export {
  NOVA_COST_OCR,
  NOVA_COST_QCM_SINGLE,
  NOVA_COST_CHAT,
  NOVA_COST_EVAL_PLAN,
  NOVA_COST_COURSE,
  NOVA_COST_EXAM_SIMULATION,
  EXAM_SIMULATION_FREE_MAX,
  EXAM_SIMULATION_FREE_CAN_SEE_RESULT,
  EXAM_SIMULATION_STARTER_MAX,
  EXAM_SIMULATION_PRO_SOFT_CAP,
  NOVA_ALLOC,
} from './nova-constants'

// ─── CLIENT SERVICE ROLE (bypass RLS pour le webhook/server actions) ─────────
function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── GET BALANCE ─────────────────────────────────────────────────────────────
export async function getNovaBalance(userId?: string): Promise<number> {
  try {
    if (userId) {
      // Lecture directe via service role (depuis webhook ou server action)
      const { data } = await svc()
        .from('wallets')
        .select('novas_balance')
        .eq('user_id', userId)
        .single()
      return data?.novas_balance ?? 0
    }

    // Lecture via client authentifié
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data } = await supabase
      .from('wallets')
      .select('novas_balance')
      .eq('user_id', user.id)
      .single()
    return data?.novas_balance ?? 0
  } catch {
    return 0
  }
}

// ─── DEDUCT — utilisé par les routes API ─────────────────────────────────────
/**
 * Déduit `amount` Novas du wallet de l'utilisateur courant (auth cookie).
 * Retourne { ok: true, balance } ou { ok: false, error }.
 */
export async function deductNovas(
  amount: number,
  reason: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, balance: 0, error: 'Non connecté' }

    const { data, error } = await supabase.rpc('deduct_novas', {
      p_user_id: user.id,
      p_amount:  amount,
      p_reason:  reason,
    })

    if (error) {
      if (error.message?.includes('insufficient_novas')) {
        return { ok: false, balance: 0, error: 'Novas insuffisantes' }
      }
      if (error.message?.includes('wallet_not_found')) {
        return { ok: false, balance: 0, error: 'Wallet introuvable' }
      }
      return { ok: false, balance: 0, error: error.message }
    }

    return { ok: true, balance: typeof data === 'number' ? data : 0 }
  } catch (e: any) {
    return { ok: false, balance: 0, error: e?.message ?? 'Erreur inconnue' }
  }
}

/**
 * Déduit des Novas pour un userId donné (service role — pour les routes API
 * qui ont déjà vérifié l'auth via createClient séparément).
 */
export async function deductNovasForUser(
  userId: string,
  amount: number,
  reason: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  try {
    const { data, error } = await svc().rpc('deduct_novas', {
      p_user_id: userId,
      p_amount:  amount,
      p_reason:  reason,
    })

    if (error) {
      if (error.message?.includes('insufficient_novas')) {
        return { ok: false, balance: 0, error: 'Novas insuffisantes' }
      }
      return { ok: false, balance: 0, error: error.message }
    }

    return { ok: true, balance: typeof data === 'number' ? data : 0 }
  } catch (e: any) {
    return { ok: false, balance: 0, error: e?.message ?? 'Erreur inconnue' }
  }
}

// ─── ADD — utilisé par le webhook Stripe ─────────────────────────────────────
/**
 * Crédite des Novas (service role, depuis le webhook Stripe ou admin).
 */
export async function addNovasForUser(
  userId: string,
  amount: number,
  reason: string
): Promise<{ ok: boolean; balance: number; error?: string }> {
  try {
    const { data, error } = await svc().rpc('add_novas', {
      p_user_id: userId,
      p_amount:  amount,
      p_reason:  reason,
    })

    if (error) return { ok: false, balance: 0, error: error.message }
    return { ok: true, balance: typeof data === 'number' ? data : 0 }
  } catch (e: any) {
    return { ok: false, balance: 0, error: e?.message ?? 'Erreur inconnue' }
  }
}

// ─── CHECK ───────────────────────────────────────────────────────────────────
export async function hasSufficientNovas(
  userId: string,
  amount: number
): Promise<boolean> {
  const balance = await getNovaBalance(userId)
  return balance >= amount
}
