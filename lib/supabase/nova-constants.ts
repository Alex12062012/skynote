/**
 * NOVA CONSTANTS — importable côté client et serveur (pas d'imports next/headers ici)
 */

// ─── COÛTS ───────────────────────────────────────────────────────────────────
export const NOVA_COST_OCR              =   2   // par photo
export const NOVA_COST_QCM_SINGLE       =   4   // régénération d'un QCM seul
export const NOVA_COST_CHAT             =  36   // par message chat
export const NOVA_COST_EVAL_PLAN        =   5   // génération plan de révision
export const NOVA_COST_COURSE           = 118   // 30✦ fiches + 88✦ QCM batch
export const NOVA_COST_EXAM_SIMULATION  = 200   // épreuve brevet simulée (génération + correction IA)

// ─── QUOTA ÉPREUVES BREVET ───────────────────────────────────────────────────
export const EXAM_SIMULATION_FREE_MAX            = 1     // 1 tentative à vie (résultat verrouillé)
export const EXAM_SIMULATION_FREE_CAN_SEE_RESULT = false // résultat visible uniquement Starter+
export const EXAM_SIMULATION_STARTER_MAX         = 1     // 1 tentative à vie (résultat visible)
export const EXAM_SIMULATION_PRO_SOFT_CAP        = 10    // cap doux à vie → "serveurs surchargés"

// ─── ALLOCATIONS PAR PLAN ────────────────────────────────────────────────────
export const NOVA_ALLOC: Record<'free' | 'starter' | 'pro', number> = {
  free:    600,
  starter: 2000,
  pro:     4000,
}
