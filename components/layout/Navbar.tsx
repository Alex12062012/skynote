'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Trophy, LayoutDashboard, Menu, X, ShoppingBag } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { CoinCounter } from '@/components/ui/CoinCounter'
import { NovaCounter } from '@/components/ui/NovaCounter'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PlayerEmblem } from '@/components/gamification/PlayerEmblem'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import type { Profile } from '@/types/database'

interface NavLink {
  href: string
  label: string
  icon: React.ElementType
}

function getNavLinks(t: (k: string) => string): NavLink[] {
  return [
    { href: '/dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { href: '/leaderboard', label: t('nav.leaderboard'), icon: Trophy },
    { href: '/boutique', label: t('nav.boutique'), icon: ShoppingBag },
  ]
}

function NavbarInner({
  profile,
  novaBalance = 0,
  userId,
}: {
  profile: Profile | null
  novaBalance?: number
  userId?: string
}) {
  const { t } = useI18n()
  const navLinks = getNavLinks(t)
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [coinSpinning, setCoinSpinning] = useState(false)
  const isDashboard = pathname === '/dashboard'

  function handleLogoClick() {
    if (!isDashboard || coinSpinning) return
    setCoinSpinning(true)
    setTimeout(() => setCoinSpinning(false), 650)
  }

  function isActive(link: NavLink): boolean {
    if (link.href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(link.href)
  }

  const effectiveUserId = userId ?? profile?.id ?? ''

  return (
    <header className="sticky top-0 z-40 border-b border-sky-border bg-sky-surface/80 backdrop-blur-lg dark:border-night-border dark:bg-night-surface/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div onClick={handleLogoClick} className={isDashboard ? 'cursor-pointer' : ''}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <style>{`
              @keyframes coin-spin-once { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
              .coin-spin { animation: coin-spin-once 0.6s cubic-bezier(0.4,0,0.2,1) forwards; }
            `}</style>
            <div style={{ perspective: 400 }}>
              <div className={coinSpinning ? 'coin-spin' : ''}>
                <SkyCoin size={32} />
              </div>
            </div>
            <span className="font-display text-[20px] font-bold tracking-tight text-text-main dark:text-text-dark-main">
              Skynote
            </span>
          </Link>
        </div>

        <nav className="hidden gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn(
                'flex items-center gap-2 rounded-input px-3 py-2 font-body text-[14px] transition-colors',
                isActive(l)
                  ? 'bg-brand-soft text-brand dark:bg-brand-dark-soft dark:text-brand-dark font-medium'
                  : 'text-text-secondary hover:bg-sky-cloud hover:text-text-main dark:text-text-dark-secondary dark:hover:bg-night-border dark:hover:text-text-dark-main'
              )}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {profile && effectiveUserId && (
            <NovaCounter initialBalance={novaBalance} userId={effectiveUserId} />
          )}
          {profile && (
            <CoinCounter initialCoins={profile.sky_coins} userId={profile.id} />
          )}
          <ThemeToggle />
          {profile && (
            <Link href="/profile"
              className={cn(
                'hidden flex-shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 md:flex',
                pathname.startsWith('/profile') && 'ring-2 ring-brand/30 ring-offset-2 ring-offset-sky-surface dark:ring-offset-night-surface rounded-full',
              )}>
              <PlayerEmblem
                prestigeLevel={(profile as any).prestige_level ?? 0}
                badgeId={(profile as any).active_badge_id ?? 'letter'}
                letter={(profile.pseudo || profile.full_name || profile.email || 'U').charAt(0)}
                size="sm"
              />
            </Link>
          )}
          <button onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-input text-text-secondary hover:bg-sky-cloud dark:text-text-dark-secondary dark:hover:bg-night-border md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-sky-border px-4 py-3 dark:border-night-border md:hidden animate-slide-in">
          {profile && effectiveUserId && (
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-[13px] text-text-secondary dark:text-text-dark-secondary">Novas disponibles</span>
              <NovaCounter initialBalance={novaBalance} userId={effectiveUserId} />
            </div>
          )}
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] transition-colors',
                isActive(l)
                  ? 'bg-brand-soft text-brand dark:bg-brand-dark-soft dark:text-brand-dark'
                  : 'text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border'
              )}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
          {profile && (
            <Link href="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border">
              <PlayerEmblem
                prestigeLevel={(profile as any).prestige_level ?? 0}
                badgeId={(profile as any).active_badge_id ?? 'letter'}
                letter={(profile.pseudo || profile.full_name || profile.email || 'U').charAt(0)}
                size="sm"
              />
              {t('nav.myAccount')}
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

export function Navbar({
  profile,
  novaBalance = 0,
  userId,
}: {
  profile: Profile | null
  novaBalance?: number
  userId?: string
}) {
  return (
    <Suspense fallback={null}>
      <NavbarInner profile={profile} novaBalance={novaBalance} userId={userId} />
    </Suspense>
  )
}
