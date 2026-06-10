'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Target, LayoutDashboard, Menu, X, Tag, Trophy } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { CoinCounter } from '@/components/ui/CoinCounter'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import type { Profile } from '@/types/database'

interface NavLink {
  href: string
  label: string
  icon: React.ElementType
}

function getNavLinks(t: (k: string) => string, isBetaEnabled: boolean): NavLink[] {
  const links: NavLink[] = [
    { href: '/dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { href: '/objectives', label: t('nav.objectives'), icon: Target },
  ]
  if (isBetaEnabled) {
    links.push({ href: '/leaderboard', label: 'Classement', icon: Trophy })
  } else {
    links.push({ href: '/pricing', label: t('nav.pricing'), icon: Tag })
  }
  return links
}

function NavbarInner({ profile, isBetaEnabled = false }: { profile: Profile | null; isBetaEnabled?: boolean }) {
  const { t } = useI18n()
  const navLinks = getNavLinks(t, isBetaEnabled)
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
          {profile && <CoinCounter initialCoins={profile.sky_coins} userId={profile.id} />}
          <ThemeToggle />
          {profile && (
            <Link href="/profile"
              className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] font-bold transition-all hover:scale-105',
                pathname.startsWith('/profile')
                  ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg ring-2 ring-brand/30'
                  : 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
              )}>
              {getInitials(profile.full_name || profile.email || 'U')}
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
          <Link href="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border">
            {t('nav.myAccount')}
          </Link>
        </div>
      )}
    </header>
  )
}

export function Navbar({ profile, isBetaEnabled = false }: { profile: Profile | null; isBetaEnabled?: boolean }) {
  return (
    <Suspense fallback={null}>
      <NavbarInner profile={profile} isBetaEnabled={isBetaEnabled} />
    </Suspense>
  )
}
