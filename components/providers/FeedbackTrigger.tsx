'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ForcedFeedback } from '@/components/ui/ForcedFeedback'

interface FeedbackTriggerProps {
  userId: string
  initialShown5: boolean
  initialShown25: boolean
}

export function FeedbackTrigger({ userId, initialShown5, initialShown25 }: FeedbackTriggerProps) {
  const [milestone, setMilestone] = useState<5 | 25 | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkMilestones()
  }, [])

  async function checkMilestones() {
    const { count } = await supabase
      .from('qcm_attempts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    const total = count ?? 0

    if (total >= 20 && !initialShown25) {
      setMilestone(25)
    } else if (total >= 5 && !initialShown5) {
      setMilestone(5)
    }
  }

  if (!milestone) return null

  return (
    <ForcedFeedback
      userId={userId}
      milestone={milestone}
      onDone={() => setMilestone(null)}
    />
  )
}
