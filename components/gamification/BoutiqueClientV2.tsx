'use client'

import { useState, useTransition, type ElementType } from 'react'
import { Lock, ShoppingBag, Palette, Award, Zap, FerrisWheel, Sparkles, Brain, Star, Rocket, Crown, Gem, Flame, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { BADGES, CONSUMABLES, TITLES, prestigeCost } from '@/lib/gamification/config'
import { buyItem, equip } from '@/lib/supabase/gamification-actions'
import { SpinWheel, WHEEL_SEGMENTS as WHEEL_LEGACY } from '@/components/boutique/SpinWheel'
import { PlayerBadge } from './PlayerBadge'
import { PrestigeButton } from './PrestigeButton'

const ICON_MAP: Record<string, ElementType> = { Brain, Star, Rocket, Crown, Gem, Flame }

type ShopTab = 'badges' | 'consumables' | 'titles'

interface UserStats {
  total_qcm_perfect: number
  best_perfect_streak: number
  wheel_spins: number
}

interface ConsumableState {
  x2_active: boolean
  x2_expires: string | null
  retry_qcm_charges: number
  skip_question_charges: number
}

interface Props {
  initialCoins: number
  prestigeLevel: number
  ownedBadges: string[]
  ownedTitles: string[]
  activeBadge: string
  activeTitle: string | null
  recentSpins: Array<{ segment_id: string; reward_type: string; net_gain: number; created_at: string }>
  userStats?: UserStats
  consumableState?: ConsumableState
}

// ─── Utilitaire barre de progression ─────────────────────────────────────────
function parseTitleProgress(unlockRule: string | undefined, stats: UserStats): { current: number; max: number } | null {
  if (!unlockRule) return null
  const match = unlockRule.match(/^(\w+)\s*>=\s*(\d+)$/)
  if (!match) return null
  const [, metric, rawMax] = match
  const max = parseInt(rawMax, 10)
  const metricMap: Record<string, number> = {
    total_qcm_perfect:   stats.total_qcm_perfect,
    best_perfect_streak: stats.best_perfect_streak,
    wheel_spins:         stats.wheel_spins,
  }
  const current = metricMap[metric] ?? 0
  return { current: Math.min(current, max), max }
}

export function BoutiqueClientV2({
  initialCoins, prestigeLevel, ownedBadges, ownedTitles, activeBadge, activeTitle, recentSpins,
  userStats, consumableState,
}: Props) {
  const defaultStats: UserStats = { total_qcm_perfect: 0, best_perfect_streak: 0, wheel_spins: 0 }
  const stats = userStats ?? defaultStats
  const cs: ConsumableState = consumableState ?? { x2_active: false, x2_expires: null, retry_qcm_charges: 0, skip_question_charges: 0 }
  const [coins, setCoins] = useState(initialCoins)
  const [tab, setTab]     = useState<ShopTab>('badges')
  const [badges, setBadges] = useState(new Set(ownedBadges))
  const [titles, setTitles] = useState(new Set(ownedTitles))
  const [equippedBadge, setEquippedBadge] = useState(activeBadge)
  const [equippedTitle, setEquippedTitle] = useState(activeTitle)
  const [feedback, setFeedback] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)
  const [pending, start] = useTransition()

  const notify = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    setFeedback({ msg, kind })
    setTimeout(() => setFeedback(null), kind === 'err' ? 5000 : 2500)
  }

  const handleBuy = (cat: 'badge' | 'title' | 'consumable', id: string, price: number) => {
    if (coins < price) { notify('Coins insuffisants', 'err'); return }
    start(async () => {
      const res = await buyItem(cat, id)
      if (res.error) { notify(res.error, 'err'); return }
      if (typeof res.newBalance === 'number') setCoins(res.newBalance)
      if (cat === 'badge') setBadges(new Set([...badges, id]))
      if (cat === 'title') setTitles(new Set([...titles, id]))
      notify('Acheté !')
    })
  }

  const handleEquip = (kind: 'badge' | 'title', id: string | null) => {
    start(async () => {
      const res = await equip(kind, id)
      if (res.error) { notify(res.error, 'err'); return }
      if (kind === 'badge') setEquippedBadge(id ?? 'letter')
      else setEquippedTitle(id)
      notify(id ? 'Équipé !' : 'Retiré')
    })
  }

  const nextPrestigeCost = prestigeCost(prestigeLevel)

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-10">
      <header>
        <h1 className="font-display text-h2 font-black text-text-main dark:text-text-dark-main">Boutique</h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Dépense tes Sky Coins pour personnaliser ton profil et booster tes gains.
        </p>
      </header>

      {/* Balance sticky bar */}
      <div className="sticky top-4 z-30 flex items-center justify-between rounded-pill border border-sky-border bg-white/80 px-5 py-2.5 shadow-card backdrop-blur dark:border-night-border dark:bg-night-surface/80">
        <div className="flex items-center gap-2">
          <SkyCoin size={20} />
          <span className="font-display text-[18px] font-black tabular-nums">{coins.toLocaleString('fr-FR')}</span>
        </div>
        {feedback && (
          <span className={cn(
            'rounded-pill px-3 py-1 font-display text-[12px] font-bold animate-pop-in',
            feedback.kind === 'err'
              ? 'bg-red-500 text-white'
              : 'bg-emerald-500 text-white',
          )}>
            {feedback.msg}
          </span>
        )}
      </div>

      {/* PRESTIGE */}
      <section>
        <SectionHeader icon={Sparkles} title="Prestige"
          desc="Reset tes coins pour gagner un chevron permanent et +5% de gains cumulatifs." />
        <div className="mt-5">
          <PrestigeButton
            currentLevel={prestigeLevel}
            currentCoins={coins}
            nextCost={nextPrestigeCost}
            badgeId={equippedBadge}
          />
        </div>
      </section>

      {/* ROUE */}
      <section>
        <SectionHeader icon={FerrisWheel} title="Roue de la fortune" badge="CHANCE"
          desc="50 coins le ticket. Espérance de gain équilibrée pour l'économie." />
        <div className="mt-5 rounded-card border border-sky-border bg-sky-surface p-6 dark:border-night-border dark:bg-night-surface">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-12">
            <div className="flex-shrink-0">
              <SpinWheel coins={coins} onBalanceUpdate={setCoins} />
            </div>
            <div className="flex w-full flex-col gap-5">
              <div>
                <p className="mb-3 font-display text-[13px] font-semibold uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
                  Lots possibles
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {WHEEL_LEGACY.map((seg) => (
                    <div key={seg.id} className="flex items-center gap-2 rounded-input border border-sky-border bg-sky-surface-2 px-3 py-2 dark:border-night-border dark:bg-night-surface-2">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: seg.color }} />
                      <span className="flex-1 font-body text-[12px] font-medium text-text-secondary dark:text-text-dark-secondary">
                        {seg.label}
                      </span>
                      <span className="font-display text-[11px] font-bold tabular-nums text-text-tertiary dark:text-text-dark-tertiary">
                        {seg.probability}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {recentSpins.length > 0 && (
                <div>
                  <p className="mb-3 font-display text-[13px] font-semibold uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
                    Derniers tours
                  </p>
                  <div className="space-y-1.5">
                    {recentSpins.map((spin, i) => (
                      <div key={i} className="flex items-center justify-between rounded-input border border-sky-border bg-sky-surface-2 px-3 py-1.5 dark:border-night-border dark:bg-night-surface-2">
                        <span className="font-body text-[12px]">{spin.segment_id}</span>
                        <span className={cn(
                          'font-display text-[13px] font-bold tabular-nums',
                          spin.net_gain > 0 ? 'text-emerald-600' : spin.net_gain < 0 ? 'text-red-600' : 'text-text-tertiary',
                        )}>
                          {spin.net_gain > 0 ? '+' + spin.net_gain : spin.net_gain}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BOUTIQUE TABS */}
      <section>
        <SectionHeader icon={ShoppingBag} title="Personnalisation"
          desc="Badges, consommables, titres : équipe-toi pour briller dans le classement." />

        <div className="mt-5 flex gap-1 rounded-card border border-sky-border bg-sky-surface-2 p-1 dark:border-night-border dark:bg-night-surface-2">
          {([
            { key: 'badges',     icon: Palette, label: 'Badges' },
            { key: 'consumables', icon: Zap,    label: 'Boosts' },
            { key: 'titles',     icon: Award,   label: 'Titres' },
          ] as { key: ShopTab; icon: ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-input py-2 font-body text-[13px] font-medium transition-all',
                tab === key
                  ? 'bg-sky-surface text-brand shadow-card dark:bg-night-surface dark:text-brand-dark'
                  : 'text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main',
              )}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'badges' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {BADGES.map(b => {
                const owned    = badges.has(b.id) || b.unlockedByDefault
                const equipped = equippedBadge === b.id
                const Icon     = ICON_MAP[b.icon]
                return (
                  <div key={b.id} className="flex flex-col items-center gap-2 rounded-card border-2 border-sky-border bg-sky-surface p-4 text-center dark:border-night-border dark:bg-night-surface">
                    <PlayerBadge badgeId={b.id} letter="A" size="md" />
                    <p className="font-display text-[13px] font-bold">{b.label}</p>
                    <span className={cn(
                      'rounded-pill px-2 py-0.5 font-body text-[10px] font-bold uppercase',
                      b.rarity === 'legendary' && 'bg-gradient-to-r from-pink-500 to-orange-500 text-white',
                      b.rarity === 'epic'      && 'bg-purple-200 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300',
                      b.rarity === 'rare'      && 'bg-blue-200 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
                      b.rarity === 'common'    && 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      b.rarity === 'default'   && 'bg-sky-cloud text-text-secondary',
                    )}>{b.rarity}</span>
                    {owned ? (
                      <button
                        onClick={() => handleEquip('badge', b.id)}
                        disabled={equipped || pending}
                        className={cn(
                          'w-full rounded-pill py-1.5 font-display text-[12px] font-bold transition',
                          equipped
                            ? 'bg-emerald-500 text-white'
                            : 'bg-brand text-white hover:bg-brand-hover',
                        )}
                      >
                        {equipped ? <><Check className="inline h-3 w-3" /> Équipé</> : 'Équiper'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy('badge', b.id, b.price)}
                        disabled={coins < b.price || pending}
                        className={cn(
                          'flex w-full items-center justify-center gap-1 rounded-pill py-1.5 font-display text-[12px] font-bold transition',
                          coins >= b.price
                            ? 'bg-brand text-white hover:bg-brand-hover'
                            : 'cursor-not-allowed bg-sky-cloud text-text-tertiary dark:bg-night-border',
                        )}
                      >
                        <SkyCoin size={11} /> {b.price}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'consumables' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CONSUMABLES.map(c => {
                // État actuel de ce consommable
                const isX2 = c.id === 'x2_coins'
                const isCharged = c.id === 'retry_qcm' || c.id === 'skip_question'
                const currentCharges = c.id === 'retry_qcm' ? cs.retry_qcm_charges : c.id === 'skip_question' ? cs.skip_question_charges : 0
                const maxCharges = (c as any).maxCharges ?? 1
                const isBlocked = isX2 ? cs.x2_active : isCharged ? currentCharges >= maxCharges : false
                const canBuy = !isBlocked && coins >= c.price && !pending

                // Temps restant pour x2
                let x2TimeLeft = ''
                if (isX2 && cs.x2_active && cs.x2_expires) {
                  const ms = new Date(cs.x2_expires).getTime() - Date.now()
                  const min = Math.max(0, Math.round(ms / 60000))
                  x2TimeLeft = min > 0 ? `Actif — ${min} min` : 'Expire bientôt'
                }

                return (
                  <div key={c.id} className={cn(
                    'flex flex-col gap-2 rounded-card border-2 p-4',
                    isBlocked
                      ? 'border-emerald-400/40 bg-emerald-50 dark:border-emerald-700/40 dark:bg-emerald-950/20'
                      : 'border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface',
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-input bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <Zap className="h-5 w-5" />
                      </div>
                      {/* Badge état */}
                      {isX2 && cs.x2_active && (
                        <span className="rounded-pill bg-emerald-500 px-2 py-0.5 font-display text-[10px] font-bold text-white">
                          {x2TimeLeft}
                        </span>
                      )}
                      {isCharged && (
                        <span className={cn(
                          'rounded-pill px-2 py-0.5 font-display text-[11px] font-bold',
                          currentCharges >= maxCharges
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-sky-cloud text-text-secondary dark:bg-night-border',
                        )}>
                          {currentCharges}/{maxCharges}
                        </span>
                      )}
                    </div>
                    <p className="font-display text-[14px] font-bold">{c.label}</p>
                    <p className="flex-1 font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">{c.desc}</p>
                    <button
                      onClick={() => handleBuy('consumable', c.id, c.price)}
                      disabled={!canBuy}
                      className={cn(
                        'flex items-center justify-center gap-1 rounded-pill py-1.5 font-display text-[12px] font-bold transition',
                        isBlocked
                          ? 'cursor-not-allowed bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : canBuy
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'cursor-not-allowed bg-sky-cloud text-text-tertiary dark:bg-night-border',
                      )}
                    >
                      {isBlocked
                        ? isX2 ? 'Boost actif' : 'Max atteint'
                        : <><SkyCoin size={11} /> {c.price}</>
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'titles' && (
            <div className="space-y-2">
              {TITLES.map(t => {
                const owned = titles.has(t.id)
                const equipped = equippedTitle === t.id
                const buyable = Boolean(t.price)
                const progress = !owned && !buyable ? parseTitleProgress(t.unlockRule, stats) : null
                const pct = progress ? Math.round((progress.current / progress.max) * 100) : 0
                return (
                  <div key={t.id} className="rounded-card border border-sky-border bg-sky-surface px-4 py-3 dark:border-night-border dark:bg-night-surface">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[15px] font-bold text-rainbow">{t.label}</span>
                          <span className="rounded-pill bg-sky-cloud px-2 py-0.5 font-body text-[10px] font-bold uppercase text-text-tertiary dark:bg-night-border">
                            {t.category}
                          </span>
                        </div>
                        <p className="truncate font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">{t.desc}</p>
                      </div>
                      <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                        {owned ? (
                          <button
                            onClick={() => handleEquip('title', equipped ? null : t.id)}
                            disabled={pending}
                            className={cn(
                              'rounded-pill px-3 py-1 font-display text-[11px] font-bold transition',
                              equipped ? 'bg-emerald-500 text-white' : 'bg-brand text-white hover:bg-brand-hover',
                            )}
                          >
                            {equipped ? 'Équipé' : 'Équiper'}
                          </button>
                        ) : buyable ? (
                          <button
                            onClick={() => handleBuy('title', t.id, t.price!)}
                            disabled={coins < (t.price ?? 0) || pending}
                            className={cn(
                              'flex items-center gap-1 rounded-pill px-3 py-1 font-display text-[11px] font-bold transition',
                              coins >= (t.price ?? 0)
                                ? 'bg-brand text-white hover:bg-brand-hover'
                                : 'cursor-not-allowed bg-sky-cloud text-text-tertiary',
                            )}
                          >
                            <SkyCoin size={10} /> {t.price}
                          </button>
                        ) : (
                          <Lock className="h-4 w-4 text-text-tertiary" />
                        )}
                      </div>
                    </div>
                    {/* Barre de progression pour les titres non-achetables non débloqués */}
                    {progress && (
                      <div className="mt-2.5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-body text-[10px] text-text-tertiary dark:text-text-dark-tertiary">
                            Progression
                          </span>
                          <span className="font-display text-[10px] font-bold tabular-nums text-text-secondary dark:text-text-dark-secondary">
                            {progress.current.toLocaleString('fr-FR')} / {progress.max.toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-sky-cloud dark:bg-night-border">
                          <div
                            className="h-full rounded-full bg-brand transition-all duration-500 dark:bg-brand-dark"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, desc, badge }:
  { icon: ElementType; title: string; desc: string; badge?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-input bg-brand-soft dark:bg-brand-dark-soft">
        <Icon className="h-5 w-5 text-brand dark:text-brand-dark" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-h3 font-black text-text-main dark:text-text-dark-main">{title}</h2>
          {badge && (
            <span className="rounded-pill bg-brand px-2 py-0.5 font-body text-[10px] font-black uppercase text-white">{badge}</span>
          )}
        </div>
        <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">{desc}</p>
      </div>
    </div>
  )
}
