/**
 * GAMIFICATION CONFIG — single source of truth
 * Toutes les règles économiques / progression / cosmétiques sont ici.
 * Modifier ces valeurs met à jour l'app ET la roue ET la boutique.
 */

// ─── DIFFICULTÉS ──────────────────────────────────────────────────────────────
export type QcmDifficulty = 'peaceful' | 'easy' | 'medium' | 'hard'

export const DIFFICULTY_COINS: Record<QcmDifficulty, number> = {
  peaceful: 2,   // "Facile"
  easy:     5,   // "Normal"
  medium:  10,   // "Hardcore"
  hard:    15,   // "Expert"
}

export const DIFFICULTY_LABELS: Record<QcmDifficulty, string> = {
  peaceful: 'Paisible',
  easy:     'Normal',
  medium:   'Hardcore',
  hard:     'Teste tes parents',
}

// ─── SCORING ──────────────────────────────────────────────────────────────────
/**
 * Pourcentage de coins gagnés selon le score/total.
 * 5/5 → 100 %, 4/5 → 50 %, < 4/5 → 0 %.
 */
export function scoreMultiplier(score: number, total: number): number {
  if (total <= 0) return 0
  const missed = total - score
  if (missed === 0) return 1     // parfait
  if (missed === 1) return 0.5   // une erreur
  return 0                       // ≥ 2 erreurs
}

// ─── STREAK ───────────────────────────────────────────────────────────────────
export const STREAK_BONUSES = [
  { threshold: 3, bonus:  5 },
  { threshold: 5, bonus: 15 },
] as const

/** Renvoie le bonus streak si le seuil est EXACTEMENT atteint à cette tentative. */
export function streakBonus(newStreakLength: number): number {
  for (const s of [...STREAK_BONUSES].reverse()) {
    if (newStreakLength === s.threshold) return s.bonus
  }
  return 0
}

// ─── EARLY GAME BOOST ─────────────────────────────────────────────────────────
export const EARLY_GAME_WINDOW = 10        // 10 premières fiches parfaites
export const EARLY_GAME_BONUS = 5          // +5 coins par 5/5 sur cette fenêtre

// ─── PRESTIGE ─────────────────────────────────────────────────────────────────
/** Coût pour passer de P{n} à P{n+1} : 500, 1000, 1500… (500 × (n+1)) */
export function prestigeCost(currentLevel: number): number {
  return 500 * (currentLevel + 1)
}
/** Multiplicateur de gain : +5 % cumulatif par prestige. */
export function prestigeMultiplier(level: number): number {
  return 1 + 0.05 * level
}

// ─── ROUE DE LA FORTUNE ───────────────────────────────────────────────────────
export const WHEEL_COST = 50

/**
 * EV attendue (espérance de gain NET) :
 *   0.40×(-50) + 0.30×(-30) + 0.15×(-10) + 0.10×(10) + 0.04×(50) + 0.01×(150)
 * = -20 -9 -1.5 +1 +2 +1.5 = -26 coins → l'économie est protégée (EV < 50).
 */
export const WHEEL_SEGMENTS = [
  { id: 'lost',      label: 'Perdu', type: 'lost'  as const, value:   0, weight: 40, color: '#EF4444', text: '#fff'    },
  { id: 'coins_20',  label: '+20',   type: 'coins' as const, value:  20, weight: 30, color: '#FB923C', text: '#fff'    },
  { id: 'coins_40',  label: '+40',   type: 'coins' as const, value:  40, weight: 15, color: '#FBBF24', text: '#fff'    },
  { id: 'coins_60',  label: '+60',   type: 'coins' as const, value:  60, weight: 10, color: '#A3E635', text: '#1a2e05' },
  { id: 'coins_100', label: '+100',  type: 'coins' as const, value: 100, weight:  4, color: '#34D399', text: '#022c22' },
  { id: 'coins_200', label: '+200',  type: 'coins' as const, value: 200, weight:  1, color: '#2DD4BF', text: '#042f2e' },
] as const
export type WheelSegment = typeof WHEEL_SEGMENTS[number]

// ─── BADGES COSMÉTIQUES ───────────────────────────────────────────────────────
export type BadgeRarity = 'default' | 'common' | 'rare' | 'epic' | 'legendary'

export interface BadgeCatalogEntry {
  id: string
  label: string
  icon: string       // lucide icon name
  price: number      // 0 si non achetable
  rarity: BadgeRarity
  color: string      // hex primaire
  unlockedByDefault?: boolean
}

export const BADGES: BadgeCatalogEntry[] = [
  { id: 'letter',  label: 'Lettre',    icon: 'letter',      price:   0, rarity: 'default', color: '#2563EB', unlockedByDefault: true },
  { id: 'brain',   label: 'Cerveau',   icon: 'Brain',       price:  50, rarity: 'common',  color: '#8B5CF6' },
  { id: 'star',    label: 'Étoile',    icon: 'Star',        price: 150, rarity: 'rare',    color: '#F59E0B' },
  { id: 'rocket',  label: 'Fusée',     icon: 'Rocket',      price: 300, rarity: 'epic',    color: '#2DD4BF' },
  { id: 'crown',   label: 'Couronne',  icon: 'Crown',       price: 600, rarity: 'legendary', color: '#F472B6' },
  { id: 'gem',     label: 'Gemme',     icon: 'Gem',         price: 300, rarity: 'epic',    color: '#10B981' },
  { id: 'flame',   label: 'Flamme',    icon: 'Flame',       price: 150, rarity: 'rare',    color: '#F97316' },
]

// ─── TITRES ───────────────────────────────────────────────────────────────────
export type TitleCategory = 'skill' | 'progression' | 'casino' | 'prestige' | 'shop'

export interface TitleCatalogEntry {
  id: string
  label: string
  category: TitleCategory
  desc: string
  price?: number                      // undefined = non achetable
  unlockRule?: string                 // clé lisible pour l'UI (calcul côté server)
}

export const TITLES: TitleCatalogEntry[] = [
  // Skill
  { id: 'machine_5_5',   label: 'Machine à 5/5',   category: 'skill',       desc: '50 QCM parfaits',                unlockRule: 'total_qcm_perfect >= 50' },
  { id: 'intouchable',   label: 'Intouchable',     category: 'skill',       desc: 'Streak de 10 5/5 d\'affilée',     unlockRule: 'best_perfect_streak >= 10' },
  // Progression
  { id: 'qcm_100',       label: '100 QCM réussis', category: 'progression', desc: '100 QCM parfaits',               unlockRule: 'total_qcm_perfect >= 100' },
  { id: 'qcm_500',       label: '500 QCM réussis', category: 'progression', desc: '500 QCM parfaits',               unlockRule: 'total_qcm_perfect >= 500' },
  // Casino
  { id: 'pro_casino',    label: 'Pro du casino',   category: 'casino',      desc: '50 tours de roue',               unlockRule: 'wheel_spins >= 50' },
  // Prestige (auto générés par le RPC perform_prestige)
  { id: 'renaissance_1', label: 'Renaissance I',   category: 'prestige',    desc: 'Prestige 1 atteint' },
  { id: 'renaissance_2', label: 'Renaissance II',  category: 'prestige',    desc: 'Prestige 2 atteint' },
  { id: 'renaissance_3', label: 'Renaissance III', category: 'prestige',    desc: 'Prestige 3 atteint' },
  // Shop
  { id: 'studious',      label: 'Studieux',        category: 'shop',        desc: 'Acheté en boutique',  price:  80 },
  { id: 'curious',       label: 'Curieux',         category: 'shop',        desc: 'Acheté en boutique',  price:  80 },
  { id: 'champion',      label: 'Champion',        category: 'shop',        desc: 'Acheté en boutique',  price: 150 },
  { id: 'legend',        label: 'Légende',         category: 'shop',        desc: 'Titre ultime',         price: 400 },
]

// ─── CONSOMMABLES BOUTIQUE ────────────────────────────────────────────────────
export const CONSUMABLES = [
  { id: 'x2_coins',      label: '×2 coins (1 h)', desc: 'Double tes gains pendant une heure — 1 seul actif à la fois', price: 50, durationHours: 1, maxCharges: 1  },
  { id: 'retry_qcm',     label: 'Retry QCM',      desc: 'Refaire un QCM sans pénalité (max 5)',                        price: 15, durationHours: 0, maxCharges: 5  },
  { id: 'skip_question', label: 'Skip question',  desc: 'Passer une question dans un QCM (max 5)',                     price: 10, durationHours: 0, maxCharges: 5  },
] as const

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
export const LEADERBOARD_MODES = ['weekly', 'monthly', 'all_time'] as const
export type LeaderboardMode = typeof LEADERBOARD_MODES[number]
export const LEADERBOARD_PAGE_SIZE = 10
