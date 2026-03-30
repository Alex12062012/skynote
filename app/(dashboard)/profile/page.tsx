import Link from 'next/link'
import { 
  Mail, Coins, Flame, Target, Trophy, BookOpen, 
  Zap, Star, ArrowRight, LogOut, Crown 
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithCoins } from '@/lib/supabase/queries'
import { signOut } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const profile = await getProfileWithCoins(user.id)

  const [{ count: coursesCount }, { count: qcmCount }, { count: perfectCount }] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'ready'),
    supabase.from('qcm_attempts').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('qcm_attempts').select('id', { count: 'exact' }).eq('user_id', user.id).eq('perfect', true),
  ])
  
  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Utilisateur'
  const email = user.email ?? ''
  const coins = profile?.sky_coins ?? 0
  const streak = profile?.streak_days ?? 0
  const plan = profile?.plan ?? 'free'
  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })
    : ''

  const isPremium = ['plus', 'premium', 'famille'].includes(plan)
  const coinsNeeded = 750 - coins
  const showPremiumBanner = !isPremium && coins >= 450 && coins < 750

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* En-tete profil */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
              {firstName}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-text-secondary dark:text-text-dark-secondary">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isPremium ? (
            <Link href="/pricing">
              <Button variant="secondary" className="gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Gratuit → Plus
              </Button>
            </Link>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-sm font-medium">
              <Star className="h-3.5 w-3.5" />
              Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Banniere Premium si proche des 750 coins */}
      {showPremiumBanner && (
        <div className="flex items-center gap-4 rounded-card border border-brand/20 bg-brand-soft p-4 dark:border-brand-dark/20 dark:bg-brand-dark-soft">
          <SkyCoin size={40} />
          <div className="flex-1 min-w-0">
            <p className="font-body text-[14px] font-semibold text-brand dark:text-brand-dark">
              Plus que {coinsNeeded} coins pour 1 mois Plus !
            </p>
            <ProgressBar value={coins} max={750} className="mt-2" />
          </div>
          <Link href="/objectives" className="flex-shrink-0">
            <Button size="sm" variant="secondary" className="gap-1">
              Voir <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Section Sky Coins */}
      <div className="rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-amber-500" />
            <div>
              <p className="font-body text-sm text-text-tertiary dark:text-text-dark-tertiary">Sky Coins</p>
              <p className="font-display text-h3 text-text-main dark:text-text-dark-main">{coins}</p>
            </div>
          </div>
          {!isPremium && (
            <Link href="/objectives">
              <Button size="sm" variant="ghost" className="gap-1 text-brand dark:text-brand-dark">
                Gagner des coins <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Cours', value: coursesCount ?? 0, icon: <BookOpen className="h-5 w-5 text-sky-500" /> },
          { label: 'QCM faits', value: qcmCount ?? 0, icon: <Zap className="h-5 w-5 text-amber-500" /> },
          { label: 'Scores parfaits', value: perfectCount ?? 0, icon: <Trophy className="h-5 w-5 text-emerald-500" /> },
        ].map((s) => (
          <div 
            key={s.label} 
            className="text-center p-4 rounded-card border border-sky-border bg-sky-surface shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark"
          >
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-text-main dark:text-text-dark-main">{s.value}</div>
            <div className="text-sm text-text-tertiary dark:text-text-dark-tertiary">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-3 rounded-card border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
        <Flame className="h-6 w-6 text-orange-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-body text-sm font-semibold text-orange-800 dark:text-orange-300">
            {streak > 0 
              ? `${streak} jour${streak > 1 ? 's' : ''} consecutif${streak > 1 ? 's' : ''}`
              : 'Commence ton streak aujourd\'hui !'}
          </p>
          <p className="text-xs text-orange-700/80 dark:text-orange-400/80 mt-0.5">
            Connecte-toi chaque jour pour garder ta serie !
          </p>
        </div>
      </div>

      {/* Objectifs & Classement */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link 
          href="/objectives"
          className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 hover:border-brand transition-colors dark:border-night-border dark:bg-night-surface dark:hover:border-brand-dark"
        >
          <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
            <Target className="h-5 w-5 text-brand dark:text-brand-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-text-main dark:text-text-dark-main">Objectifs</p>
            <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary">Suis ta progression</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
        </Link>

        <Link 
          href="/leaderboard"
          className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 hover:border-brand transition-colors dark:border-night-border dark:bg-night-surface dark:hover:border-brand-dark"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 dark:bg-amber-900/30">
            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-text-main dark:text-text-dark-main">Classement</p>
            <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary">Compare-toi aux autres</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
        </Link>
      </div>

      {/* Infos compte */}
      <div className="rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
        <h3 className="font-display text-h4 text-text-main dark:text-text-dark-main mb-4">Informations du compte</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-sky-border/50 dark:border-night-border/50">
            <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary">Membre depuis</span>
            <span className="text-sm font-medium text-text-main dark:text-text-dark-main">{memberSince}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-sky-border/50 dark:border-night-border/50">
            <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary">Plan actuel</span>
            <span className={`text-sm font-medium ${isPremium ? 'text-amber-600 dark:text-amber-400' : 'text-text-main dark:text-text-dark-main'}`}>
              {isPremium ? `${plan.charAt(0).toUpperCase() + plan.slice(1)}` : 'Gratuit'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary">Email</span>
            <span className="text-sm font-medium text-text-main dark:text-text-dark-main">{email}</span>
          </div>
        </div>
      </div>

      {/* Bouton deconnexion */}
      <form action={signOut} className="mt-2">
        <Button type="submit" variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2">
          <LogOut className="h-4 w-4" />
          Se deconnecter
        </Button>
      </form>
    </div>
  )
}
