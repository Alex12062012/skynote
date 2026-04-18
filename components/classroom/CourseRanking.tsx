'use client'

import { Trophy, Medal, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudentRanking {
  firstName: string
  lastName: string
  qcmCompleted: number
  qcmTotal: number
  avgScore: number
  perfectCount: number
}

interface CourseRankingProps {
  students: StudentRanking[]
  qcmTotal: number
  skycoinsInRanking?: boolean
}

export function CourseRanking({ students, qcmTotal, skycoinsInRanking }: CourseRankingProps) {
  const sorted = [...students].sort((a, b) => {
    if (b.qcmCompleted !== a.qcmCompleted) return b.qcmCompleted - a.qcmCompleted
    return b.avgScore - a.avgScore
  })

  const groups: { label: string; students: (StudentRanking & { rank: number })[] }[] = []
  let rank = 1

  const byQcm = new Map<number, StudentRanking[]>()
  for (const s of sorted) {
    const list = byQcm.get(s.qcmCompleted) || []
    list.push(s)
    byQcm.set(s.qcmCompleted, list)
  }

  for (const [qcmCount, groupStudents] of [...byQcm.entries()].sort((a, b) => b[0] - a[0])) {
    const label = qcmCount === 0 ? 'Non commence' : `${qcmCount}/${qcmTotal} QCM`
    const ranked = groupStudents.map((s) => ({ ...s, rank: rank++ }))
    groups.push({ label, students: ranked })
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-card border border-sky-border bg-sky-surface p-8 text-center dark:border-night-border dark:bg-night-surface">
        <BarChart3 className="mx-auto mb-3 h-10 w-10 text-text-secondary dark:text-text-dark-secondary" />
        <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">Aucun eleve dans cette classe</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="font-display text-[16px] font-semibold text-text-main dark:text-text-dark-main">Classement</h3>
      </div>
      {groups.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-body text-[12px] font-medium uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary">
              {group.label}
            </span>
            <div className="flex-1 border-t border-sky-border/50 dark:border-night-border/50" />
          </div>
          <div className="space-y-1.5">
            {group.students.map((s) => {
              const medal = s.rank === 1 ? '\uD83E\uDD47' : s.rank === 2 ? '\uD83E\uDD48' : s.rank === 3 ? '\uD83E\uDD49' : null
              return (
                <div key={`${s.firstName}-${s.lastName}`}
                  className="flex items-center justify-between rounded-input bg-sky-bg px-4 py-3 dark:bg-night-bg">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[14px] font-bold text-text-tertiary dark:text-text-dark-tertiary w-6 text-center">
                      {medal || s.rank}
                    </span>
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold',
                      s.qcmCompleted > 0 ? 'bg-success/10 text-success' : 'bg-sky-cloud text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary')}>
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
                      {s.firstName} {s.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.qcmCompleted > 0 ? (
                      <>
                        <span className="font-body text-[13px] font-semibold text-success">
                          {s.avgScore.toFixed(1)}/20
                        </span>
                        {s.perfectCount > 0 && (
                          <span className="font-body text-[11px] text-amber-500">
                            {'\u2B50'} {s.perfectCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                        {'\u2014'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}