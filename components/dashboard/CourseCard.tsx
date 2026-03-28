import Link from 'next/link'
import { Clock } from 'lucide-react'
import { SubjectBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate, cn } from '@/lib/utils'

interface CourseCardProps {
  id: string; title: string; subject: string; color: string
  status: string; progress: number; created_at: string; source_type: string
}

const SOURCE_ICONS: Record<string, string> = { text: '📝', pdf: '📄', photo: '📷', vocal: '🎙️' }

export function CourseCard({ id, title, subject, color, status, progress, created_at, source_type }: CourseCardProps) {
  const isReady = status === 'ready'
  const isError = status === 'error'

  return (
    <Link href={`/courses/${id}`}
      className="group relative flex flex-col gap-3 rounded-card border border-sky-border bg-sky-surface p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-night-border-strong/30">

      {/* Accent top bar */}
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: color }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5">
            <SubjectBadge subject={subject} />
            <span className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
              {SOURCE_ICONS[source_type] ?? '📝'}
            </span>
          </div>
          <h3 className="font-display text-[15px] font-semibold text-text-main line-clamp-2 dark:text-text-dark-main group-hover:text-brand dark:group-hover:text-brand-dark transition-colors duration-200">
            {title}
          </h3>
        </div>
        <div className={cn(
          'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full transition-all',
          isReady ? 'bg-success shadow-[0_0_6px_rgba(5,150,105,0.4)]' : isError ? 'bg-error' : 'bg-amber-400 animate-pulse-soft'
        )} />
      </div>

      {isReady && progress > 0 && (
        <div className="space-y-1">
          <ProgressBar value={progress} />
          <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">{progress}% maitrise</p>
        </div>
      )}

      {!isReady && (
        <span className={cn('w-fit rounded-pill px-2.5 py-0.5 font-body text-[11px] font-medium',
          isError ? 'bg-red-50 text-error dark:bg-red-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
        )}>
          {isError ? 'Erreur' : 'En cours...'}
        </span>
      )}

      <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary flex items-center gap-1 mt-auto">
        <Clock className="h-3 w-3" />
        {formatDate(created_at)}
      </p>
    </Link>
  )
}
