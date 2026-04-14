import React from 'react'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const defaultIcon = <BookOpen className="h-10 w-10 text-text-tertiary dark:text-text-dark-tertiary" />
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-sky-border py-16 text-center dark:border-night-border', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-cloud dark:bg-night-border">
        {icon !== undefined ? icon : defaultIcon}
      </div>
      <div>
        <p className="font-display text-h4 text-text-main dark:text-text-dark-main">{title}</p>
        {description && <p className="mt-1 max-w-xs font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">{description}</p>}
      </div>
      {action}
    </div>
  )
}
