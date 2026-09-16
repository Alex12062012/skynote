/**
 * NOVA CONSTANTS — importable cote client et serveur (pas d'imports next/headers ici)
 */

// Couts
export const NOVA_COST_OCR              =   2
export const NOVA_COST_QCM_SINGLE       =   4
export const NOVA_COST_CHAT             =  36
export const NOVA_COST_EVAL_PLAN        =   5
export const NOVA_COST_COURSE           = 118
export const NOVA_COST_EXAM_SIMULATION  =   0   // gratuit — resultats verrouilles sans Starter

// Quota epreuves brevet
export const EXAM_SIMULATION_FREE_MAX            = 1
export const EXAM_SIMULATION_FREE_CAN_SEE_RESULT = false
export const EXAM_SIMULATION_STARTER_MAX         = 1
export const EXAM_SIMULATION_PRO_SOFT_CAP        = 10

// Allocations par plan
export const NOVA_ALLOC: Record<'free' | 'starter' | 'pro', number> = {
  free:    600,
  starter: 2000,
  pro:     4000,
}
