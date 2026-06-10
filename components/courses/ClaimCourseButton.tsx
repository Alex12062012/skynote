'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { claimSharedCourse } from '@/lib/supabase/claim-actions'

interface ClaimCourseButtonProps {
  /** ID du cours partagé (celui de la personne qui partage) */
  courseId: string
  /** true si l'utilisateur connecté est le propriétaire du cours partagé */
  isOwnCourse: boolean
}

export function ClaimCourseButton({ courseId, isOwnCourse }: ClaimCourseButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [claimedId, setClaimedId] = useState<string | null>(null)

  if (isOwnCourse) {
    return (
      <Button size="sm" variant="secondary" onClick={() => router.push(`/courses/${courseId}`)}>
        Voir dans mon espace
      </Button>
    )
  }

  if (claimedId) {
    return (
      <Button size="sm" className="gap-1.5" onClick={() => router.push(`/courses/${claimedId}`)}>
        <CheckCircle2 className="h-4 w-4" />Ouvrir dans mon espace
      </Button>
    )
  }

  function handleClaim() {
    setError('')
    startTransition(async () => {
      const result = await claimSharedCourse(courseId)
      if (result.error || !result.courseId) {
        setError(result.error || 'Une erreur est survenue')
        return
      }
      setClaimedId(result.courseId)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" className="gap-1.5" onClick={handleClaim} loading={isPending}>
        <Download className="h-4 w-4" />Ajouter à mon compte
      </Button>
      {error && <p className="font-body text-[12px] text-error">{error}</p>}
    </div>
  )
}
