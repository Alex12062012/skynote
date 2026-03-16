import { cn } from '@/lib/utils'
import { SkyCoin } from './SkyCoin'

interface ProgressBarProps { value: number; max?: number; showCoin?: boolean; className?: string }

export function ProgressBar({ value, max = 100, showCoin = false, className }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className={cn('relative h-2 w-full overflow-visible rounded-pill bg-sky-cloud dark:bg-night-border', className)}>
      <div
        className="h-full rounded-pill transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2563EB, #60A5FA)' }}
      />
      {showCoin && pct > 0 && pct < 100 && (
        <div className="absolute -top-2.5 transition-all duration-700" style={{ left: `calc(${pct}% - 10px)` }}>
          <SkyCoin size={20} />
        </div>
      )}
    </div>
  )
}
