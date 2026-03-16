import { cn } from '@/lib/utils'

interface EmptyStateProps { icon?: string; title: string; description?: string; action?: React.ReactNode; className?: string }

export function EmptyState({ icon = '📭', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-sky-border py-16 text-center dark:border-night-border', className)}>
      {icon && <span className="text-4xl">{icon}</span>}
      <div>
        <p className="font-display text-h4 text-text-main dark:text-text-dark-main">{title}</p>
        {description && <p className="mt-1 max-w-xs font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">{description}</p>}
      </div>
      {action}
    </div>
  )
}
