import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { getFamilleStats } from '@/lib/supabase/famille-actions'
import { calculateTalent } from '@/lib/famille-utils'
import { FamilleManager } from '@/components/famille/FamilleManager'
import type { Metadata } from 'next'


export const metadata: Metadata = { title: 'Navigation Familiale — Skynote' }

export default async function FamillePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  // Seuls les comptes famille peuvent accéder
  const { data: betaSetting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'beta_mode')
    .single()

  const betaActive = betaSetting?.value === 'true'
  const hasFamilleAccess = profile?.plan === 'famille' || betaActive

  if (!hasFamilleAccess) {
    redirect('/pricing')
  }

  const { group, children } = await getFamilleStats(user.id)

  // Calculer les talents côté serveur pour éviter de passer une fonction au client
  const childrenWithTalent = (children || []).map((child: any) => ({
    ...child,
    talent: calculateTalent(child.child_stats || []),
  }))

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">
          Navigation Familiale
        </h1>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Gérez les comptes de vos enfants et suivez leur progression.
        </p>
      </div>

      <FamilleManager
        parentId={user.id}
        initialGroup={group}
        initialChildren={childrenWithTalent}
      />
    </div>
  )
}
