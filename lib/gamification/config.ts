/**
 * GAMIFICATION CONFIG — single source of truth
 * Toutes les règles économiques / progression / cosmétiques sont ici.
 * Modifier ces valeurs met à jour l'app ET les coffres ET la boutique.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI IL N'Y A PLUS DE ROUE DE LA FORTUNE (suppression du hasard pur)
 * ─────────────────────────────────────────────────────────────────────────────
 * L'ancien système était une roue payante (50 coins le tour) à probabilités
 * pondérées (~38 % « Perdu », skins à 5 %, secrets à 4 %) avec une espérance de
 * gain volontairement négative. Sur un public de 10-17 ans, ce design coche
 * toutes les cases de la « loot box » :
 *   • mise obligatoire d'une monnaie ayant une valeur d'usage dans l'app ;
 *   • résultat aléatoire non connu à l'avance ;
 *   • récompenses à rareté artificielle (skins secrets) ;
 *   • espérance négative → boucle de rejeu compulsif.
 *
 * Risque régulatoire identifié à l'audit :
 *   • Belgique (Commission des jeux de hasard, 2018) et Pays-Bas : loot boxes
 *     assimilées à des jeux de hasard → interdiction pure et simple ;
 *   • France : position DGCCRF / ARJEL-ANJ et rapport du Sénat sur la
 *     protection des mineurs en ligne, vigilance accrue sur les mécaniques
 *     aléatoires payantes visant les mineurs ;
 *   • UE : Digital Fairness Act et résolution du Parlement européen (2023) sur
 *     les loot boxes et les « dark patterns » ciblant les mineurs ;
 *   • RGPD / design éthique : une app EdTech scolaire ne peut pas défendre une
 *     boucle de renforcement aléatoire auprès des établissements et des parents.
 *
 * REMPLACEMENT — « Coffres de Maîtrise » (MASTERY_CHEST_TRACK ci-dessous) :
 *   • le coffre se débloque à l'EFFORT : 1 coffre tous les MASTERY_CHEST_INTERVAL
 *     QCM réussis en 5/5 (aucune mise, aucune monnaie dépensée) ;
 *   • le contenu de CHAQUE coffre est connu à l'avance et affiché dans l'UI :
 *     la piste est un cycle fixe et déterministe, l'élève sait exactement ce
 *     qu'il obtiendra au coffre n°7 avant de l'ouvrir ;
 *   • aucun tirage : chestReward(n) est une fonction pure de n, il n'y a plus
 *     un seul Math.random() dans la boucle de récompense ;
 *   • aucun « Perdu » possible : l'effort fourni est toujours récompensé.
 * Conséquence : la progression reste motivante mais elle est indexée sur le
 * travail scolaire, pas sur la chance ni sur la dépense.
 */

// ─── DIFFICULTÉS ──────────────────────────────────────────────────────────────
import type { QcmDifficulty } from '@/lib/ai/prompts'
export type { QcmDifficulty }

export const DIFFICULTY_COINS: Record<QcmDifficulty, number> = {
  peaceful: 2,   // "Facile"
  easy:     5,   // "Normal"
  medium:  10,   // "Hardcore"
}

export const DIFFICULTY_LABELS: Record<QcmDifficulty, string> = {
  peaceful: 'Paisible',
  easy:     'Normal',
  medium:   'Hardcore',
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
/** Coût pour passer de P{n} à P{n+1} : 100, 200, 300… (100 × (n+1)) */
export function prestigeCost(currentLevel: number): number {
  return 100 * (currentLevel + 1)
}
/** Multiplicateur de gain : +5 % cumulatif par prestige. */
export function prestigeMultiplier(level: number): number {
  return 1 + 0.05 * level
}

// ─── COFFRES DE MAÎTRISE ──────────────────────────────────────────────────────
/**
 * Remplace la roue de la fortune (cf. avertissement en tête de fichier).
 * Règle unique : 1 coffre débloqué tous les MASTERY_CHEST_INTERVAL QCM parfaits.
 * Gratuit, garanti, et le contenu est public avant l'ouverture.
 */
export const MASTERY_CHEST_INTERVAL = 5

export type ChestRewardType = 'coins' | 'nova' | 'boost_x2' | 'skin'

export interface MasteryChestTier {
  /** identifiant stable du palier (position dans le cycle) */
  id: string
  label: string
  type: ChestRewardType
  /** montant de coins / de Novas ; 0 pour un boost ou un skin */
  value: number
  /** description affichée à l'élève AVANT l'ouverture */
  desc: string
  color: string
  text: string
}

/**
 * Piste de récompenses — cycle fixe et déterministe de 8 paliers.
 * Le coffre n°N donne MASTERY_CHEST_TRACK[(N - 1) % 8]. Rien n'est tiré au sort :
 * l'élève peut lire à l'avance ce que donnera son 12ᵉ coffre.
 */
export const MASTERY_CHEST_TRACK: readonly MasteryChestTier[] = [
  { id: 'tier_1', label: '+40 coins',   type: 'coins',    value:  40, desc: '40 Sky Coins',                    color: '#FB923C', text: '#fff'    },
  { id: 'tier_2', label: '+60 coins',   type: 'coins',    value:  60, desc: '60 Sky Coins',                    color: '#FBBF24', text: '#fff'    },
  { id: 'tier_3', label: '+25 ✦',      type: 'nova',     value:  25, desc: '25 Novas ✦ (crédits IA)',         color: '#6366F1', text: '#fff'    },
  { id: 'tier_4', label: '+80 coins',   type: 'coins',    value:  80, desc: '80 Sky Coins',                    color: '#A3E635', text: '#1a2e05' },
  { id: 'tier_5', label: 'Boost ×2',    type: 'boost_x2', value:   0, desc: 'Boost ×2 coins pendant 1 heure',  color: '#A78BFA', text: '#fff'    },
  { id: 'tier_6', label: '+120 coins',  type: 'coins',    value: 120, desc: '120 Sky Coins',                   color: '#34D399', text: '#022c22' },
  { id: 'tier_7', label: '+50 ✦',      type: 'nova',     value:  50, desc: '50 Novas ✦ (crédits IA)',         color: '#4F46E5', text: '#fff'    },
  { id: 'tier_8', label: 'Skin',        type: 'skin',     value:   0, desc: 'Le prochain skin de ta collection', color: '#F472B6', text: '#fff'  },
] as const

/** Si la collection de skins est complète, le coffre « Skin » donne ce montant. */
export const CHEST_SKIN_FALLBACK_COINS = 150

/** Nombre de coffres débloqués par l'effort fourni (QCM parfaits cumulés). */
export function chestsUnlocked(totalPerfectQcm: number): number {
  if (totalPerfectQcm <= 0) return 0
  return Math.floor(totalPerfectQcm / MASTERY_CHEST_INTERVAL)
}

/** Contenu du coffre n°N (1-indexé) — fonction pure, aucun aléa. */
export function chestReward(chestNumber: number): MasteryChestTier {
  const idx = (Math.max(1, Math.trunc(chestNumber)) - 1) % MASTERY_CHEST_TRACK.length
  return MASTERY_CHEST_TRACK[idx]
}

export interface ChestProgress {
  /** coffres débloqués au total par l'effort */
  unlocked: number
  /** coffres déjà ouverts */
  claimed: number
  /** coffres ouvrables tout de suite */
  claimable: number
  /** numéro du prochain coffre à ouvrir (1-indexé) */
  nextChestNumber: number
  /** contenu du prochain coffre — connu à l'avance */
  nextReward: MasteryChestTier
  /** QCM parfaits déjà faits dans le palier en cours (0 → INTERVAL-1) */
  progressInStep: number
  /** QCM parfaits restants avant le prochain déblocage */
  remainingToUnlock: number
}

/** État complet de la piste pour l'UI — pur, dérivé de l'effort et des ouvertures. */
export function chestProgress(totalPerfectQcm: number, chestsClaimed: number): ChestProgress {
  const unlocked  = chestsUnlocked(totalPerfectQcm)
  const claimed   = Math.max(0, chestsClaimed)
  const claimable = Math.max(0, unlocked - claimed)
  const perfect   = Math.max(0, totalPerfectQcm)
  const progressInStep = perfect % MASTERY_CHEST_INTERVAL
  return {
    unlocked,
    claimed,
    claimable,
    nextChestNumber: claimed + 1,
    nextReward: chestReward(claimed + 1),
    progressInStep,
    remainingToUnlock: claimable > 0 ? 0 : MASTERY_CHEST_INTERVAL - progressInStep,
  }
}

// ─── BADGES COSMÉTIQUES ───────────────────────────────────────────────────────
/**
 * ÉCHELLE DE MAÎTRISE — remplace l'ancien vocabulaire gacha
 * (Common / Rare / Epic / Legendary).
 *
 * Le palier visuel est strictement le même (mêmes couleurs, mêmes effets,
 * même hiérarchie) : seul le langage change. On ne parle plus de « rareté »
 * — une notion de loterie — mais de niveau de maîtrise atteint, ce qui décrit
 * ce que l'élève a réellement accompli pour obtenir la récompense.
 */
export type MasteryTier = 'base' | 'debutant' | 'confirme' | 'expert' | 'maitre'

export const MASTERY_TIER_LABELS: Record<MasteryTier, string> = {
  base:     'Standard',
  debutant: 'Débutant',
  confirme: 'Confirmé',
  expert:   'Expert',
  maitre:   'Maître',
}

/** Ordre croissant — utile pour trier ou comparer deux paliers. */
export const MASTERY_TIER_ORDER: readonly MasteryTier[] = ['base', 'debutant', 'confirme', 'expert', 'maitre']

/**
 * Correspondance depuis l'ancien vocabulaire encore présent dans les lignes
 * déjà écrites en base (user_inventory.data.rarity). Lecture seule.
 */
const LEGACY_RARITY_MAP: Record<string, MasteryTier> = {
  default:   'base',
  common:    'debutant',
  rare:      'confirme',
  epic:      'expert',
  legendary: 'maitre',
}

/** Normalise un palier venant de la base (ancien ou nouveau vocabulaire). */
export function normalizeMasteryTier(raw: string | null | undefined): MasteryTier {
  if (!raw) return 'confirme'
  if ((MASTERY_TIER_ORDER as readonly string[]).includes(raw)) return raw as MasteryTier
  return LEGACY_RARITY_MAP[raw] ?? 'confirme'
}

/** Libellé affichable d'un palier, y compris pour une valeur héritée. */
export function masteryTierLabel(raw: string | null | undefined): string {
  return MASTERY_TIER_LABELS[normalizeMasteryTier(raw)]
}

export interface BadgeCatalogEntry {
  id: string
  label: string
  icon: string       // lucide icon name
  price: number      // 0 si non achetable
  /** palier de maîtrise (ex-« rareté ») — même hiérarchie visuelle */
  tier: MasteryTier
  color: string      // hex primaire
  unlockedByDefault?: boolean
}

export const BADGES: BadgeCatalogEntry[] = [
  { id: 'letter',  label: 'Lettre',    icon: 'letter',      price:   0, tier: 'base',     color: '#2563EB', unlockedByDefault: true },
  { id: 'brain',   label: 'Cerveau',   icon: 'Brain',       price:  50, tier: 'debutant', color: '#8B5CF6' },
  { id: 'star',    label: 'Étoile',    icon: 'Star',        price: 150, tier: 'confirme', color: '#F59E0B' },
  { id: 'rocket',  label: 'Fusée',     icon: 'Rocket',      price: 300, tier: 'expert',   color: '#2DD4BF' },
  { id: 'crown',   label: 'Couronne',  icon: 'Crown',       price: 600, tier: 'maitre',   color: '#F472B6' },
  { id: 'gem',     label: 'Gemme',     icon: 'Gem',         price: 300, tier: 'expert',   color: '#10B981' },
  { id: 'flame',   label: 'Flamme',    icon: 'Flame',       price: 150, tier: 'confirme', color: '#F97316' },
]

// ─── TITRES ───────────────────────────────────────────────────────────────────
export type TitleCategory = 'skill' | 'progression' | 'chest' | 'prestige' | 'shop'

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
  // Coffres de maîtrise (id conservé pour ne pas casser les lignes user_titles existantes)
  { id: 'pro_casino',    label: 'Collectionneur',  category: 'chest',       desc: '50 coffres de maîtrise ouverts', unlockRule: 'chests_claimed >= 50' },
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
  { id: 'x2_coins',      label: '×2 coins (1 h)',   desc: 'Double tes gains pendant une heure — 1 seul actif à la fois',    price: 50, durationHours: 1, maxCharges: 1 },
  { id: 'retry_qcm',     label: 'Retry QCM',        desc: 'Refaire un QCM sans pénalité (max 5)',                            price: 15, durationHours: 0, maxCharges: 5 },
  { id: 'hint_question', label: 'Indication',       desc: 'Révèle un indice sur une question dans un QCM (max 5)',           price: 10, durationHours: 0, maxCharges: 5 },
] as const

// ─── SKINS DE CARTE ───────────────────────────────────────────────────────────
export interface SkinEntry {
  id: string
  label: string
  desc: string
  tier: Extract<MasteryTier, 'confirme' | 'maitre'>
  secret: boolean
  /** Classes Tailwind pour le wrapper de la carte */
  cardClass: string
  /** boxShadow inline (Tailwind ne peut pas purger les valeurs arbitraires ici) */
  boxShadow: string
}

export const SKINS: SkinEntry[] = [
  // ── Normaux (10) ──────────────────────────────────────────────────────────
  {
    id: 'skin_aube', label: 'Aube', desc: 'Les teintes rosées du lever de soleil', tier: 'confirme', secret: false,
    cardClass: 'border-rose-300/60 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 dark:border-rose-700/40 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-amber-950/20',
    boxShadow: '0 0 0 1px rgba(251,113,133,0.35), 0 2px 14px rgba(251,113,133,0.18)',
  },
  {
    id: 'skin_crepuscule', label: 'Crépuscule', desc: 'Orange et violet fusionnés au couchant', tier: 'confirme', secret: false,
    cardClass: 'border-purple-300/60 bg-gradient-to-r from-orange-50 via-purple-50 to-pink-50 dark:border-purple-700/40 dark:from-orange-950/20 dark:via-purple-950/30 dark:to-pink-950/20',
    boxShadow: '0 0 0 1px rgba(192,132,252,0.35), 0 2px 14px rgba(192,132,252,0.18)',
  },
  {
    id: 'skin_nuage', label: 'Nuage', desc: 'Douceur cotonneuse et ciel dégagé', tier: 'confirme', secret: false,
    cardClass: 'border-sky-300/60 bg-gradient-to-r from-white via-sky-50 to-blue-50 dark:border-sky-600/40 dark:from-sky-950/30 dark:via-blue-950/20 dark:to-slate-900/30',
    boxShadow: '0 0 0 1px rgba(125,211,252,0.4), 0 2px 14px rgba(125,211,252,0.2)',
  },
  {
    id: 'skin_aurore', label: 'Aurore Boréale', desc: 'Danseuses lumineuses dans le ciel nordique', tier: 'confirme', secret: false,
    cardClass: 'border-teal-400/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-purple-50 dark:border-teal-500/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-purple-950/30',
    boxShadow: '0 0 0 1px rgba(45,212,191,0.4), 0 2px 16px rgba(45,212,191,0.22)',
  },
  {
    id: 'skin_soleil', label: 'Soleil', desc: 'Éclat doré du soleil de midi', tier: 'confirme', secret: false,
    cardClass: 'border-yellow-400/70 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:border-yellow-500/50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-950/30',
    boxShadow: '0 0 0 1px rgba(250,204,21,0.5), 0 2px 16px rgba(250,204,21,0.25)',
  },
  {
    id: 'skin_lune', label: 'Lune', desc: 'Lumière lunaire froide et apaisante', tier: 'confirme', secret: false,
    cardClass: 'border-slate-400/50 bg-gradient-to-r from-slate-50 via-blue-50 to-slate-100 dark:border-slate-500/40 dark:from-slate-900/50 dark:via-slate-800/40 dark:to-slate-900/50',
    boxShadow: '0 0 0 1px rgba(148,163,184,0.4), 0 2px 12px rgba(148,163,184,0.2)',
  },
  {
    id: 'skin_tempete', label: 'Tempête', desc: 'Électricité dans l\'air orageux', tier: 'confirme', secret: false,
    cardClass: 'border-blue-500/60 bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 dark:border-blue-600/50 dark:from-slate-900/50 dark:via-blue-950/30 dark:to-slate-900/50',
    boxShadow: '0 0 0 1px rgba(59,130,246,0.45), 0 2px 16px rgba(59,130,246,0.22)',
  },
  {
    id: 'skin_nuit_etoilee', label: 'Nuit Étoilée', desc: 'Constellations dans l\'infini', tier: 'confirme', secret: false,
    cardClass: 'border-indigo-400/60 bg-gradient-to-r from-indigo-50 via-slate-50 to-violet-50 dark:border-indigo-500/50 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-violet-950/30',
    boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 2px 14px rgba(99,102,241,0.22)',
  },
  {
    id: 'skin_brume', label: 'Brume', desc: 'Matinée brumeuse et mystérieuse', tier: 'confirme', secret: false,
    cardClass: 'border-violet-300/50 bg-gradient-to-r from-violet-50 via-slate-50 to-pink-50 dark:border-violet-600/40 dark:from-violet-950/25 dark:via-slate-900/30 dark:to-pink-950/20',
    boxShadow: '0 0 0 1px rgba(167,139,250,0.35), 0 2px 12px rgba(167,139,250,0.18)',
  },
  {
    id: 'skin_ocean', label: 'Océan', desc: 'Profondeurs bleues et mystérieuses', tier: 'confirme', secret: false,
    cardClass: 'border-cyan-500/60 bg-gradient-to-r from-cyan-50 via-blue-50 to-teal-50 dark:border-cyan-600/50 dark:from-cyan-950/30 dark:via-blue-950/30 dark:to-teal-950/25',
    boxShadow: '0 0 0 1px rgba(6,182,212,0.45), 0 2px 16px rgba(6,182,212,0.22)',
  },
  // ── Secrets (5) ───────────────────────────────────────────────────────────
  {
    id: 'skin_secret_phoenix', label: 'Phœnix', desc: 'Renaître des flammes, plus fort', tier: 'maitre', secret: true,
    cardClass: 'border-orange-500/70 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:border-orange-500/60 dark:from-red-950/45 dark:via-orange-950/35 dark:to-yellow-950/25',
    boxShadow: '0 0 0 2px rgba(249,115,22,0.55), 0 4px 22px rgba(249,115,22,0.3)',
  },
  {
    id: 'skin_secret_cristal', label: 'Cristal', desc: 'Pureté prismatique de la glace éternelle', tier: 'maitre', secret: true,
    cardClass: 'border-cyan-300/70 bg-gradient-to-r from-white via-cyan-50 to-blue-50 dark:border-cyan-400/60 dark:from-cyan-950/45 dark:via-blue-950/35 dark:to-slate-900/50',
    boxShadow: '0 0 0 2px rgba(34,211,238,0.55), 0 4px 22px rgba(34,211,238,0.3)',
  },
  {
    id: 'skin_secret_cosmos', label: 'Cosmos', desc: 'L\'immensité sombre de l\'univers', tier: 'maitre', secret: true,
    cardClass: 'border-violet-600/70 bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 dark:border-violet-500/65 dark:from-violet-950/55 dark:via-purple-950/45 dark:to-pink-950/35',
    boxShadow: '0 0 0 2px rgba(124,58,237,0.6), 0 4px 24px rgba(124,58,237,0.35)',
  },
  {
    id: 'skin_secret_dragon', label: 'Dragon', desc: 'Écailles émeraude d\'une créature légendaire', tier: 'maitre', secret: true,
    cardClass: 'border-emerald-500/70 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:border-emerald-500/60 dark:from-emerald-950/50 dark:via-green-950/40 dark:to-teal-950/35',
    boxShadow: '0 0 0 2px rgba(16,185,129,0.55), 0 4px 22px rgba(16,185,129,0.3)',
  },
  {
    id: 'skin_secret_prismatique', label: 'Prismatique', desc: 'Hologramme vivant, spectre complet de la lumière', tier: 'maitre', secret: true,
    cardClass: 'border-fuchsia-400/70 bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 dark:border-fuchsia-500/60 dark:from-pink-950/40 dark:via-purple-950/35 dark:to-cyan-950/35',
    boxShadow: '0 0 0 2px rgba(232,121,249,0.55), 0 4px 24px rgba(232,121,249,0.32)',
  },
]

/** IDs des skins normaux (non secrets), dans l'ordre d'obtention */
export const REGULAR_SKIN_IDS = SKINS.filter(s => !s.secret).map(s => s.id)
/** IDs des skins secrets, dans l'ordre d'obtention (après les normaux) */
export const SECRET_SKIN_IDS  = SKINS.filter(s => s.secret).map(s => s.id)

/**
 * Ordre d'obtention des skins via les coffres — fixe et public.
 * On donne le premier skin non possédé : aucun tirage, aucun doublon,
 * et l'élève sait quel skin il obtiendra à son prochain coffre « Skin ».
 */
export const SKIN_UNLOCK_ORDER = [...REGULAR_SKIN_IDS, ...SECRET_SKIN_IDS]

/** Prochain skin à débloquer, ou null si la collection est complète. */
export function nextSkinToUnlock(ownedSkinIds: readonly string[]): string | null {
  const owned = new Set(ownedSkinIds)
  return SKIN_UNLOCK_ORDER.find(id => !owned.has(id)) ?? null
}

// Rétrocompatibilité avec l'ancien item_id
export const SKIN_ID_ALIASES: Record<string, string> = {
  'frame_etoile_rare': 'skin_soleil',
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
export const LEADERBOARD_MODES = ['weekly', 'monthly', 'all_time'] as const
export type LeaderboardMode = typeof LEADERBOARD_MODES[number]
export const LEADERBOARD_PAGE_SIZE = 10
