'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ForcedFeedback } from '@/components/ui/ForcedFeedback'

interface FeedbackTriggerProps {
  userId: string
  initialShown5: boolean
  initialShown25: boolean
}

// NB : les champs DB s'appellent encore feedback_shown_5 / feedback_shown_25 pour des
// raisons historiques (anciens paliers QCM), mais ils représentent maintenant le 1er
// palier (1 cours créé) et le 2e palier (5 cours créés).
export function FeedbackTrigger({ userId, initialShown5, initialShown25 }: FeedbackTriggerProps) {
  const [milestone, setMilestone] = useState<1 | 5 | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const checkMilestones = useCallback(async () => {
    const { count } = await supabase
      .from('courses')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    const total = count ?? 0

    if (total >= 5 && !initialShown25) {
      setMilestone(5)
    } else if (total >= 1 && !initialShown5) {
      setMilestone(1)
    }
  }, [supabase, userId, initialShown5, initialShown25])

  useEffect(() => {
    checkMilestones()
  }, [checkMilestones])

  if (!milestone) return null

  return (
    <ForcedFeedback
      userId={userId}
      milestone={milestone}
      onDone={() => setMilestone(null)}
    />
  )
}
