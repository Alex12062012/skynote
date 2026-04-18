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

// ─── SKINS DE CARTE ───────────────────────────────────────────────────────────
export interface SkinEntry {
  id: string
  label: string
  desc: string
  rarity: 'rare' | 'legendary'
  secret: boolean
  /** Classes Tailwind pour le wrapper de la carte */
  cardClass: string
  /** boxShadow inline (Tailwind ne peut pas purger les valeurs arbitraires ici) */
  boxShadow: string
}

export const SKINS: SkinEntry[] = [
  // ── Normaux (10) ──────────────────────────────────────────────────────────
  {
    id: 'skin_aube', label: 'Aube', desc: 'Les teintes rosées du lever de soleil', rarity: 'rare', secret: false,
    cardClass: 'border-rose-300/60 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 dark:border-rose-700/40 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-amber-950/20',
    boxShadow: '0 0 0 1px rgba(251,113,133,0.35), 0 2px 14px rgba(251,113,133,0.18)',
  },
  {
    id: 'skin_crepuscule', label: 'Crépuscule', desc: 'Orange et violet fusionnés au couchant', rarity: 'rare', secret: false,
    cardClass: 'border-purple-300/60 bg-gradient-to-r from-orange-50 via-purple-50 to-pink-50 dark:border-purple-700/40 dark:from-orange-950/20 dark:via-purple-950/30 dark:to-pink-950/20',
    boxShadow: '0 0 0 1px rgba(192,132,252,0.35), 0 2px 14px rgba(192,132,252,0.18)',
  },
  {
    id: 'skin_nuage', label: 'Nuage', desc: 'Douceur cotonneuse et ciel dégagé', rarity: 'rare', secret: false,
    cardClass: 'border-sky-300/60 bg-gradient-to-r from-white via-sky-50 to-blue-50 dark:border-sky-600/40 dark:from-sky-950/30 dark:via-blue-950/20 dark:to-slate-900/30',
    boxShadow: '0 0 0 1px rgba(125,211,252,0.4), 0 2px 14px rgba(125,211,252,0.2)',
  },
  {
    id: 'skin_aurore', label: 'Aurore Boréale', desc: 'Danseuses lumineuses dans le ciel nordique', rarity: 'rare', secret: false,
    cardClass: 'border-teal-400/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-purple-50 dark:border-teal-500/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-purple-950/30',
    boxShadow: '0 0 0 1px rgba(45,212,191,0.4), 0 2px 16px rgba(45,212,191,0.22)',
  },
  {
    id: 'skin_soleil', label: 'Soleil', desc: 'Éclat doré du soleil de midi', rarity: 'rare', secret: false,
    cardClass: 'border-yellow-400/70 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:border-yellow-500/50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-950/30',
    boxShadow: '0 0 0 1px rgba(250,204,21,0.5), 0 2px 16px rgba(250,204,21,0.25)',
  },
  {
    id: 'skin_lune', label: 'Lune', desc: 'Lumière lunaire froide et apaisante', rarity: 'rare', secret: false,
    cardClass: 'border-slate-400/50 bg-gradient-to-r from-slate-50 via-blue-50 to-slate-100 dark:border-slate-500/40 dark:from-slate-900/50 dark:via-slate-800/40 dark:to-slate-900/50',
    boxShadow: '0 0 0 1px rgba(148,163,184,0.4), 0 2px 12px rgba(148,163,184,0.2)',
  },
  {
    id: 'skin_tempete', label: 'Tempête', desc: 'Électricité dans l\'air orageux', rarity: 'rare', secret: false,
    cardClass: 'border-blue-500/60 bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 dark:border-blue-600/50 dark:from-slate-900/50 dark:via-blue-950/30 dark:to-slate-900/50',
    boxShadow: '0 0 0 1px rgba(59,130,246,0.45), 0 2px 16px rgba(59,130,246,0.22)',
  },
  {
    id: 'skin_nuit_etoilee', label: 'Nuit Étoilée', desc: 'Constellations dans l\'infini', rarity: 'rare', secret: false,
    cardClass: 'border-indigo-400/60 bg-gradient-to-r from-indigo-50 via-slate-50 to-violet-50 dark:border-indigo-500/50 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-violet-950/30',
    boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 2px 14px rgba(99,102,241,0.22)',
  },
  {
    id: 'skin_brume', label: 'Brume', desc: 'Matinée brumeuse et mystérieuse', rarity: 'rare', secret: false,
    cardClass: 'border-violet-300/50 bg-gradient-to-r from-violet-50 via-slate-50 to-pink-50 dark:border-violet-600/40 dark:from-violet-950/25 dark:via-slate-900/30 dark:to-pink-950/20',
    boxShadow: '0 0 0 1px rgba(167,139,250,0.35), 0 2px 12px rgba(167,139,250,0.18)',
  },
  {
    id: 'skin_ocean', label: 'Océan', desc: 'Profondeurs bleues et mystérieuses', rarity: 'rare', secret: false,
    cardClass: 'border-cyan-500/60 bg-gradient-to-r from-cyan-50 via-blue-50 to-teal-50 dark:border-cyan-600/50 dark:from-cyan-950/30 dark:via-blue-950/30 dark:to-teal-950/25',
    boxShadow: '0 0 0 1px rgba(6,182,212,0.45), 0 2px 16px rgba(6,182,212,0.22)',
  },
  // ── Secrets (5) ───────────────────────────────────────────────────────────
  {
    id: 'skin_secret_phoenix', label: 'Phœnix', desc: 'Renaître des flammes, plus fort', rarity: 'legendary', secret: true,
    cardClass: 'border-orange-500/70 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:border-orange-500/60 dark:from-red-950/45 dark:via-orange-950/35 dark:to-yellow-950/25',
    boxShadow: '0 0 0 2px rgba(249,115,22,0.55), 0 4px 22px rgba(249,115,22,0.3)',
  },
  {
    id: 'skin_secret_cristal', label: 'Cristal', desc: 'Pureté prismatique de la glace éternelle', rarity: 'legendary', secret: true,
    cardClass: 'border-cyan-300/70 bg-gradient-to-r from-white via-cyan-50 to-blue-50 dark:border-cyan-400/60 dark:from-cyan-950/45 dark:via-blue-950/35 dark:to-slate-900/50',
    boxShadow: '0 0 0 2px rgba(34,211,238,0.55), 0 4px 22px rgba(34,211,238,0.3)',
  },
  {
    id: 'skin_secret_cosmos', label: 'Cosmos', desc: 'L\'immensité sombre de l\'univers', rarity: 'legendary', secret: true,
    cardClass: 'border-violet-600/70 bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 dark:border-violet-500/65 dark:from-violet-950/55 dark:via-purple-950/45 dark:to-pink-950/35',
    boxShadow: '0 0 0 2px rgba(124,58,237,0.6), 0 4px 24px rgba(124,58,237,0.35)',
  },
  {
    id: 'skin_secret_dragon', label: 'Dragon', desc: 'Écailles émeraude d\'une créature légendaire', rarity: 'legendary', secret: true,
    cardClass: 'border-emerald-500/70 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:border-emerald-500/60 dark:from-emerald-950/50 dark:via-green-950/40 dark:to-teal-950/35',
    boxShadow: '0 0 0 2px rgba(16,185,129,0.55), 0 4px 22px rgba(16,185,129,0.3)',
  },
  {
    id: 'skin_secret_prismatique', label: 'Prismatique', desc: 'Hologramme vivant, spectre complet de la lumière', rarity: 'legendary', secret: true,
    cardClass: 'border-fuchsia-400/70 bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 dark:border-fuchsia-500/60 dark:from-pink-950/40 dark:via-purple-950/35 dark:to-cyan-950/35',
    boxShadow: '0 0 0 2px rgba(232,121,249,0.55), 0 4px 24px rgba(232,121,249,0.32)',
  },
]

/** IDs des skins normaux (non secrets) — utilisé pour le tirage roue */
export const REGULAR_SKIN_IDS = SKINS.filter(s => !s.secret).map(s => s.id)
/** IDs des skins secrets — utilisé pour le tirage roue */
export const SECRET_SKIN_IDS  = SKINS.filter(s => s.secret).map(s => s.id)

// Rétrocompatibilité avec l'ancien item_id
export const SKIN_ID_ALIASES: Record<string, string> = {
  'frame_etoile_rare': 'skin_soleil',
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
export const LEADERBOARD_MODES = ['weekly', 'monthly', 'all_time'] as const
export type LeaderboardMode = typeof LEADERBOARD_MODES[number]
export const LEADERBOARD_PAGE_SIZE = 10
