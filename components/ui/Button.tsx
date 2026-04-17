import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-input font-body font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-brand-dark dark:focus-visible:ring-offset-night-bg'
    const variants = {
      primary: 'bg-brand text-white hover:bg-brand-hover shadow-btn hover:shadow-none dark:bg-brand-dark dark:text-night-bg dark:hover:bg-brand-dark-hover',
      secondary: 'border border-sky-border-strong bg-sky-surface text-text-main hover:bg-sky-cloud dark:border-night-border-strong dark:bg-night-surface dark:text-text-dark-main dark:hover:bg-night-border',
      ghost: 'text-text-secondary hover:bg-sky-cloud hover:text-text-main dark:text-text-dark-secondary dark:hover:bg-night-surface dark:hover:text-text-dark-main',
      danger: 'bg-error/10 text-error hover:bg-error/20 border border-error/20',
    }
    const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-[14px]', lg: 'h-12 px-6 text-[15px]' }

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
