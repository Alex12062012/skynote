import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicProfile } from '@/lib/supabase/gamification-actions'
import { ProfileHero } from '@/components/gamification/ProfileHero'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { pseudo: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pseudo = decodeURIComponent(params.pseudo)
  return { title: `${pseudo} — Profil Skynote` }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const pseudo = decodeURIComponent(params.pseudo)
  const profile = await getPublicProfile(pseudo)
  if (!profile) notFound()

  return (
    <div className="mx-auto max-w-2xl animate-fade-in py-4">
      <ProfileHero profile={profile} />
    </div>
  )
}
