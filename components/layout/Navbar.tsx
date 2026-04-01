'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Target, LayoutDashboard, Users, Menu, X, Tag, School } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { CoinCounter } from '@/components/ui/CoinCounter'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/database'

function getNavLinks(role: string) {
  const links = [
    { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { href: '/objectives', label: 'Objectifs', icon: Target },
  ]
  if (role === 'teacher') {
    links.push({ href: '/dashboard', label: 'Code de classe', icon: School })
  } else if (role !== 'student') {
    // Les utilisateurs normaux voient Forfaits, les élèves non
    links.push({ href: '/pricing', label: 'Forfaits', icon: Tag })
  }
  return links
}

export function Navbar({ profile }: { profile: Profile | null }) {
  const isFamille = profile?.plan === 'famille'
  const role = profile?.role ?? 'user'
  const navLinks = getNavLinks(role)
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
    <header className="sticky top-0 z-40 border-b border-sky-border bg-sky-surface/80 backdrop-blur-lg dark:border-night-border dark:bg-night-surface/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <div onClick={handleLogoClick} className={isDashboard ? 'cursor-pointer' : ''}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <style>{`
              @keyframes coin-spin-once {
                0%   { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
              }
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

        {/* Desktop nav */}
        <nav className="hidden gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn(
                'flex items-center gap-2 rounded-input px-3 py-2 font-body text-[14px] transition-colors',
                pathname.startsWith(l.href) && l.href !== '/dashboard' || pathname === l.href
                  ? 'bg-brand-soft text-brand dark:bg-brand-dark-soft dark:text-brand-dark font-medium'
                  : 'text-text-secondary hover:bg-sky-cloud hover:text-text-main dark:text-text-dark-secondary dark:hover:bg-night-border dark:hover:text-text-dark-main'
              )}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
          {isFamille && (
            <Link href="/famille"
              className={cn(
                'flex items-center gap-2 rounded-input px-3 py-2 font-body text-[14px] transition-colors',
                pathname.startsWith('/famille')
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 font-medium'
                  : 'text-text-secondary hover:bg-sky-cloud hover:text-text-main dark:text-text-dark-secondary dark:hover:bg-night-border'
              )}>
              <Users className="h-4 w-4" /> Famille
            </Link>
          )}
        </nav>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {/* Compteur coins */}
          {profile && (
            <CoinCounter initialCoins={profile.sky_coins} userId={profile.id} />
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Avatar → profil */}
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

          {/* Menu mobile */}
          <button onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-input text-text-secondary hover:bg-sky-cloud dark:text-text-dark-secondary dark:hover:bg-night-border md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-sky-border px-4 py-3 dark:border-night-border md:hidden animate-slide-in">
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
          <Link href="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border">
            Mon compte
          </Link>
        </div>
      )}
    </header>
  )
}
