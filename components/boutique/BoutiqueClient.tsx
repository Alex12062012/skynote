'use client'

import { useState, type ElementType } from 'react'
import { SpinWheel, WHEEL_SEGMENTS } from './SpinWheel'
import { Lock, Palette, UserCircle2, Award, Tag, FerrisWheel, ShoppingBag, Handshake, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkyCoin } from '@/components/ui/SkyCoin'

interface RecentSpin {
  segment_id: string
  reward_type: string
  net_gain: number
  created_at: string
}

interface BoutiqueClientProps {
  initialCoins: number
  recentSpins: RecentSpin[]
}

const THEMES = [
  { id: 'sky',    name: "Ciel d'été",       colors: ['#2563EB', '#60A5FA', '#DBEAFE'], price: 150 },
  { id: 'night',  name: 'Nuit étoilée',     colors: ['#0F172A', '#1E3A5F', '#60A5FA'], price: 150 },
  { id: 'aurora', name: 'Aurore boréale',   colors: ['#059669', '#8B5CF6', '#2DD4BF'], price: 200 },
  { id: 'sunset', name: 'Coucher de soleil',colors: ['#EF4444', '#F97316', '#FBBF24'], price: 200 },
]

const AVATARS = [
  { id: 'rocket', color: '#2563EB', name: 'Roquette', price: 100 },
  { id: 'star',   color: '#F59E0B', name: 'Étoile',   price: 100 },
  { id: 'brain',  color: '#8B5CF6', name: 'Cerveau',  price: 100 },
  { id: 'owl',    color: '#10B981', name: 'Chouette', price: 100 },
  { id: 'gem',    color: '#2DD4BF', name: 'Gemme',    price: 200 },
  { id: 'crown',  color: '#F472B6', name: 'Couronne', price: 300 },
]

const TITLES = [
  { id: 'studious', label: 'Studieux',       desc: 'Pour les travailleurs acharnés',       price: 80,  wheel: false },
  { id: 'curious',  label: 'Curieux',        desc: 'Pour les explorateurs du savoir',      price: 80,  wheel: false },
  { id: 'champion', label: 'Champion',       desc: 'Pour ceux qui dominent le classement', price: 150, wheel: false },
  { id: 'legend',   label: 'Légende',        desc: 'Le titre ultime — très rare',          price: 400, wheel: false },
  { id: 'lucky',    label: 'Chanceux',       desc: 'Pour les maîtres de la roue',          price: 0,   wheel: true  },
  { id: 'shooting', label: 'Étoile filante', desc: 'Décroché depuis la roue',              price: 0,   wheel: true  },
]

type ShopTab = 'themes' | 'avatars' | 'titles'

export function BoutiqueClient({ initialCoins, recentSpins }: BoutiqueClientProps) {
  const [coins, setCoins] = useState(initialCoins)
  const [tab, setTab]     = useState<ShopTab>('themes')

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-10">

      <div>
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Boutique</h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Dépense tes Sky Coins pour débloquer des récompenses
        </p>
      </div>

      {/* Roue */}
      <section>
        <SectionHeader icon={FerrisWheel} title="Roue de la fortune" badge="NOUVEAU"
          desc="Tente ta chance ! 50 coins par tour — tu peux gagner plus… ou moins." />
        <div className="mt-5 rounded-card border border-sky-border bg-sky-surface p-6 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
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
                  {WHEEL_SEGMENTS.map((seg) => (
                    <div key={seg.id} className="flex items-center gap-2 rounded-input border border-sky-border bg-sky-surface-2 px-3 py-2 dark:border-night-border dark:bg-night-surface-2">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: seg.color }} />
                      <span className="font-body text-[12px] font-medium text-text-secondary dark:text-text-dark-secondary">
                        {seg.label}
                      </span>
                      {(seg.type === 'frame' || seg.type === 'boost_xp') && (
                        <span className="ml-auto rounded-pill bg-brand-soft px-1.5 py-0.5 font-body text-[10px] font-bold text-brand dark:bg-brand-dark-soft dark:text-brand-dark">
                          RARE
                        </span>
                      )}
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
                    {recentSpins.map((spin, i) => {
                      const seg = WHEEL_SEGMENTS.find(s => s.id === spin.segment_id)
                      const isPos = spin.net_gain > 0
                      const isNeg = spin.net_gain < 0
                      return (
                        <div key={i} className="flex items-center justify-between rounded-input border border-sky-border bg-sky-surface-2 px-3 py-1.5 dark:border-night-border dark:bg-night-surface-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: seg?.color ?? '#94A3B8' }} />
                            <span className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
                              {seg?.label ?? spin.segment_id}
                            </span>
                          </div>
                          <span className="font-display text-[13px] font-bold tabular-nums"
                            style={{ color: isPos ? '#059669' : isNeg ? '#DC2626' : '#94A3B8' }}>
                            {isPos ? '+' + spin.net_gain : spin.net_gain}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Boutique */}
      <section>
        <SectionHeader icon={ShoppingBag} title="Boutique"
          desc="Dépense tes coins directement pour personnaliser ton profil." />

        <div className="mt-5 flex gap-1 rounded-card border border-sky-border bg-sky-surface-2 p-1 dark:border-night-border dark:bg-night-surface-2">
          {([
            { key: 'themes',  icon: Palette,    label: 'Thèmes'  },
            { key: 'avatars', icon: UserCircle2, label: 'Avatars' },
            { key: 'titles',  icon: Award,       label: 'Titres'  },
          ] as { key: ShopTab; icon: ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-input py-2 font-body text-[13px] font-medium transition-all',
                tab === key
                  ? 'bg-sky-surface text-brand shadow-card dark:bg-night-surface dark:text-brand-dark'
                  : 'text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main'
              )}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'themes'  && <ThemesGrid />}
          {tab === 'avatars' && <AvatarsGrid />}
          {tab === 'titles'  && <TitlesList />}
        </div>
      </section>

      {/* Sponsors */}
      <section>
        <SectionHeader icon={Handshake} title="Sponsors"
          desc="Des offres spéciales de nos partenaires arrivent bientôt." />
        <div className="mt-5 flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-sky-border py-14 text-center dark:border-night-border">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-cloud dark:bg-night-border">
            <Tag className="h-7 w-7 text-text-tertiary dark:text-text-dark-tertiary" />
          </div>
          <div>
            <p className="font-display text-h4 text-text-main dark:text-text-dark-main">Bientôt disponible</p>
            <p className="mt-1 max-w-xs font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Des offres exclusives de nos sponsors seront disponibles ici.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}

function SectionHeader({ icon: Icon, title, desc, badge }: { icon: ElementType; title: string; desc: string; badge?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-input bg-brand-soft dark:bg-brand-dark-soft">
        <Icon className="h-4 w-4 text-brand dark:text-brand-dark" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">{title}</h2>
          {badge && (
            <span className="rounded-pill bg-brand px-2 py-0.5 font-body text-[11px] font-bold uppercase text-white">
              {badge}
            </span>
          )}
        </div>
        <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">{desc}</p>
      </div>
    </div>
  )
}

function ThemesGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {THEMES.map((theme) => (
        <div key={theme.id} className="relative overflow-hidden rounded-card border border-sky-border bg-sky-surface shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
          <div className="h-20 w-full" style={{ background: `linear-gradient(135deg, ${theme.colors.join(', ')})` }} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <Lock className="h-5 w-5 text-white opacity-90" />
          </div>
          <div className="p-3">
            <p className="font-body text-[12px] font-semibold text-text-main dark:text-text-dark-main">{theme.name}</p>
            <div className="mt-1 flex items-center gap-1">
              <SkyCoin size={12} />
              <span className="font-display text-[11px] font-bold text-text-secondary dark:text-text-dark-secondary">{theme.price}</span>
            </div>
          </div>
          <ComingSoonBadge />
        </div>
      ))}
    </div>
  )
}

function AvatarsGrid() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {AVATARS.map((av) => (
        <div key={av.id} className="relative flex flex-col items-center gap-2 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
          <div className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: av.color + '22', border: '2px solid ' + av.color }}>
            <div className="h-4 w-4 rounded-full" style={{ background: av.color }} />
          </div>
          <p className="font-body text-[11px] font-medium text-text-main dark:text-text-dark-main">{av.name}</p>
          <div className="flex items-center gap-1">
            <SkyCoin size={11} />
            <span className="font-display text-[11px] font-bold text-text-secondary dark:text-text-dark-secondary">{av.price}</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-card bg-sky-bg/60 dark:bg-night-bg/60">
            <Lock className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
          </div>
          <ComingSoonBadge />
        </div>
      ))}
    </div>
  )
}

function TitlesList() {
  return (
    <div className="space-y-2">
      {TITLES.map((t) => (
        <div key={t.id} className="relative flex items-center justify-between overflow-hidden rounded-card border border-sky-border bg-sky-surface px-4 py-3 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
          <div className="flex items-center gap-3">
            <span className="font-display text-[16px] font-bold text-text-main dark:text-text-dark-main">{t.label}</span>
            <span className="hidden font-body text-[12px] text-text-secondary dark:text-text-dark-secondary sm:block">{t.desc}</span>
          </div>
          <div className="flex items-center gap-2">
            {t.wheel ? (
              <span className="flex items-center gap-1 rounded-pill bg-brand-soft px-2 py-0.5 font-body text-[11px] font-bold text-brand dark:bg-brand-dark-soft dark:text-brand-dark">
                <RotateCcw className="h-3 w-3" /> Roue
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <SkyCoin size={13} />
                <span className="font-display text-[13px] font-bold text-text-secondary dark:text-text-dark-secondary">{t.price}</span>
              </div>
            )}
            <Lock className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
          </div>
          <ComingSoonBadge />
        </div>
      ))}
    </div>
  )
}

function ComingSoonBadge() {
  return (
    <div className="absolute right-1.5 top-1.5">
      <span className="rounded-pill bg-sky-cloud px-1.5 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary">
        Bientôt
      </span>
    </div>
  )
}
