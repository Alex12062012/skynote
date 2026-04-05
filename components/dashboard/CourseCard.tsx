'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { SubjectBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface CourseCardProps {
  id: string; title: string; subject: string; color: string
  status: string; progress: number; created_at: string; source_type: string
}

const SOURCE_ICONS: Record<string, string> = { text: '\uD83D\uDCDD', pdf: '\uD83D\uDCC4', photo: '\uD83D\uDCF7', vocal: '\uD83C\uDFA4' }

export function CourseCard({ id, title, subject, color, status, progress, created_at, source_type }: CourseCardProps) {
  const { t } = useI18n()
  const isReady = status === 'ready'
  const isError = status === 'error'

  return (
    <Link href={`/courses/${id}`}
      className="group flex flex-col gap-3 rounded-card border border-sky-border bg-sky-surface p-5 shadow-card transition-all duration-150 hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SubjectBadge subject={subject} />
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              {SOURCE_ICONS[source_type] ?? '\uD83D\uDCDD'}
            </span>
          </div>
          <h3 className="font-display text-[16px] font-semibold text-text-main line-clamp-2 dark:text-text-dark-main group-hover:text-brand dark:group-hover:text-brand-dark transition-colors">
            {title}
          </h3>
        </div>
        <div className={cn('mt-1 h-2 w-2 flex-shrink-0 rounded-full', isReady ? 'bg-success' : isError ? 'bg-error' : 'bg-amber-400 animate-pulse')} />
      </div>
      {isReady && progress > 0 && (
        <div className="space-y-1">
          <ProgressBar value={progress} />
          <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">{progress}% {t('course.mastered')}</p>
        </div>
      )}
      {!isReady && (
        <span className={cn('w-fit rounded-pill px-2.5 py-0.5 font-body text-[11px] font-medium',
          isError ? 'bg-red-50 text-error dark:bg-red-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
        )}>
          {isError ? `\u274C ${t('course.error')}` : `\u23F3 ${t('course.processing')}`}
        </span>
      )}
      <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatDate(created_at)}
      </p>
    </Link>
  )
}
