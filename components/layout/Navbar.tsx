'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Target, LayoutDashboard, Users, Menu, X, Tag, BookOpen } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { CoinCounter } from '@/components/ui/CoinCounter'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/database'

const navLinks = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/courses', label: 'Cours', icon: BookOpen },
  { href: '/objectives', label: 'Objectifs', icon: Target },
]

export function Navbar({ profile }: { profile: Profile | null }) {
  const isFamille = profile?.plan === 'famille'
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [coinSpinning, setCoinSpinning] = useState(false)
  const isDashboard = pathname === '/dashboard'

  function handleLogoClick() {
    if (!isDashboard || coinSpinning) return
    setCoinSpinning(true)
    setTimeout(() => setCoinSpinning(false), 650)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sky-border/60 bg-sky-surface/75 backdrop-blur-xl dark:border-night-border/40 dark:bg-night-surface/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <div onClick={handleLogoClick} className={isDashboard ? 'cursor-pointer' : ''}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <style>{`
              @keyframes coin-spin-once {
                0%   { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
              }
              .coin-spin { animation: coin-spin-once 0.6s cubic-bezier(0.4,0,0.2,1) forwards; }
            `}</style>
            <div style={{ perspective: 400 }}>
              <div className={coinSpinning ? 'coin-spin' : ''}>
                <SkyCoin size={28} />
              </div>
            </div>
            <span className="font-display text-[18px] font-bold tracking-tight text-text-main dark:text-text-dark-main">
              Skynote
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden gap-0.5 md:flex">
          {navLinks.map((l) => {
            const active = pathname.startsWith(l.href) && l.href !== '/dashboard' || pathname === l.href
            return (
              <Link key={l.href} href={l.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 font-body text-[13px] transition-all duration-200',
                  active
                    ? 'bg-brand text-white shadow-sm dark:bg-brand-dark dark:text-night-bg font-medium'
                    : 'text-text-secondary hover:text-text-main hover:bg-sky-cloud/70 dark:text-text-dark-secondary dark:hover:text-text-dark-main dark:hover:bg-night-border/50'
                )}>
                <l.icon className="h-3.5 w-3.5" />{l.label}
              </Link>
            )
          })}
          {isFamille && (
            <Link href="/famille"
              className={cn(
                'flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 font-body text-[13px] transition-all duration-200',
                pathname.startsWith('/famille')
                  ? 'bg-purple-500 text-white shadow-sm dark:bg-purple-400 dark:text-night-bg font-medium'
                  : 'text-text-secondary hover:text-text-main hover:bg-sky-cloud/70 dark:text-text-dark-secondary dark:hover:bg-night-border/50'
              )}>
              <Users className="h-3.5 w-3.5" /> Famille
            </Link>
          )}
        </nav>

        {/* Actions droite */}
        <div className="flex items-center gap-1.5">
          {profile && <CoinCounter initialCoins={profile.sky_coins} userId={profile.id} />}
          <ThemeToggle />
          {profile && (
            <Link href="/profile"
              className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold transition-all duration-200',
                pathname.startsWith('/profile')
                  ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg ring-2 ring-brand/20 dark:ring-brand-dark/20 scale-105'
                  : 'bg-brand/90 text-white dark:bg-brand-dark/90 dark:text-night-bg hover:scale-105'
              )}>
              {getInitials(profile.full_name || profile.email || 'U')}
            </Link>
          )}
          <button onClick={() => setOpen(!open)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-sky-cloud dark:text-text-dark-secondary dark:hover:bg-night-border md:hidden transition-colors">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-sky-border/60 px-4 py-2 dark:border-night-border/40 md:hidden animate-slide-in">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-brand-soft text-brand dark:bg-brand-dark-soft dark:text-brand-dark'
                  : 'text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border'
              )}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
          {isFamille && (
            <Link href="/famille" onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border">
              <Users className="h-4 w-4" /> Famille
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
