import Link from 'next/link'
import { Mail, Flame, Target, Trophy, BookOpen, Zap, Star, ArrowRight, LogOut, Crown } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileWithCoins } from '@/lib/supabase/queries'
import { signOut } from '@/lib/supabase/actions'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LanguageSection } from '@/components/profile/LanguageSection'
import { PlayerEmblem } from '@/components/gamification/PlayerEmblem'
import { getServerLocale, createServerT } from '@/lib/i18n/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function ProfilePage() {
  const locale = await getServerLocale()
  const t = createServerT(locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfileWithCoins(user.id)

  const [{ count: coursesCount }, { count: qcmCount }, { count: perfectCount }] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'ready'),
    supabase.from('qcm_attempts').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('qcm_attempts').select('id', { count: 'exact' }).eq('user_id', user.id).eq('perfect', true),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User'
  const email = user.email ?? ''
  const coins = profile?.sky_coins ?? 0
  const streak = profile?.streak_days ?? 0
  const plan = profile?.plan ?? 'free'
  const dateLocale = locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : 'fr-FR'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  const isPremium = ['plus', 'famille'].includes(plan)
  const coinsNeeded = 750 - coins
  const showPremiumBanner = !isPremium && coins >= 450 && coins < 750

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <PlayerEmblem
            prestigeLevel={(profile as any)?.prestige_level ?? 0}
            badgeId={(profile as any)?.active_badge_id ?? 'letter'}
            letter={firstName.charAt(0).toUpperCase()}
            size="lg"
            glow
            animated
          />
          <div>
            <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">{firstName}</h1>
            <div className="flex items-center gap-2 mt-1 text-text-secondary dark:text-text-dark-secondary">
              <Mail className="h-4 w-4" /><span className="text-sm">{email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* badge plan masqué */}
        </div>
      </div>

      {/* banner premium masqué */}

      <div className="rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkyCoin size={32} />
            <div>
              <p className="font-body text-sm text-text-tertiary dark:text-text-dark-tertiary">{t('profile.skycoins')}</p>
              <p className="font-display text-h3 text-text-main dark:text-text-dark-main">{coins}</p>
            </div>
          </div>
          <Link href="/objectives"><Button size="sm" variant="ghost" className="gap-1 text-brand dark:text-brand-dark">{t('profile.earnCoins')} <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('profile.courses'), value: coursesCount ?? 0, icon: <BookOpen className="h-5 w-5 text-sky-500" /> },
          { label: t('profile.qcmDone'), value: qcmCount ?? 0, icon: <Zap className="h-5 w-5 text-amber-500" /> },
          { label: t('profile.perfectScores'), value: perfectCount ?? 0, icon: <Trophy className="h-5 w-5 text-emerald-500" /> },
        ].map((s) => (
          <div key={s.label} className="text-center p-4 rounded-card border border-sky-border bg-sky-surface shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-text-main dark:text-text-dark-main">{s.value}</div>
            <div className="text-sm text-text-tertiary dark:text-text-dark-tertiary">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-card border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
        <Flame className="h-6 w-6 text-orange-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-body text-sm font-semibold text-orange-800 dark:text-orange-300">
            {streak > 0 ? `${streak} ${t('profile.streak')}` : t('profile.streakStart')}
          </p>
          <p className="text-xs text-orange-700/80 dark:text-orange-400/80 mt-0.5">{t('profile.streakKeep')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/objectives" className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 hover:border-brand transition-colors dark:border-night-border dark:bg-night-surface dark:hover:border-brand-dark">
          <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0"><Target className="h-5 w-5 text-brand dark:text-brand-dark" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-text-main dark:text-text-dark-main">{t('profile.objectives')}</p>
            <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary">{t('profile.followProgress')}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
        </Link>
        <Link href="/leaderboard" className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 hover:border-brand transition-colors dark:border-night-border dark:bg-night-surface dark:hover:border-brand-dark">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 dark:bg-amber-900/30"><Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-text-main dark:text-text-dark-main">{t('profile.leaderboard')}</p>
            <p className="text-xs text-text-tertiary dark:text-text-dark-tertiary">{t('profile.compareOthers')}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
        </Link>
      </div>

      <div className="rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
        <h3 className="font-display text-h4 text-text-main dark:text-text-dark-main mb-4">{t('profile.accountInfo')}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-sky-border/50 dark:border-night-border/50">
            <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary">{t('profile.memberSince')}</span>
            <span className="text-sm font-medium text-text-main dark:text-text-dark-main">{memberSince}</span>
          </div>
          {/* ligne plan masquée */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-tertiary dark:text-text-dark-tertiary">{t('profile.email')}</span>
            <span className="text-sm font-medium text-text-main dark:text-text-dark-main">{email}</span>
          </div>
          <div className="border-t border-sky-border/50 dark:border-night-border/50 pt-3"><LanguageSection /></div>
        </div>
      </div>

      <form action={signOut} className="mt-2">
        <Button type="submit" variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2">
          <LogOut className="h-4 w-4" />{t('profile.logout')}
        </Button>
      </form>
    </div>
  )
}