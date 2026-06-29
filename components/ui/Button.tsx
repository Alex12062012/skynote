import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-input font-body font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-brand-dark dark:focus-visible:ring-offset-night-bg'
    const variants = {
      // Aligné sur le CTA de la landing : bleu marque plein + texte blanc dans les deux modes
      primary: 'bg-brand text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.7)] hover:bg-brand-hover hover:shadow-[0_14px_38px_-10px_rgba(37,99,235,0.9)] hover:-translate-y-0.5 dark:bg-brand dark:text-white dark:hover:bg-brand-hover',
      secondary: 'border border-sky-border-strong bg-sky-surface text-text-main hover:bg-sky-cloud hover:-translate-y-0.5 dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:hover:border-brand-dark/40 dark:hover:bg-night-surface-2',
      ghost: 'text-text-secondary hover:bg-sky-cloud hover:text-text-main dark:text-text-dark-secondary dark:hover:bg-night-surface dark:hover:text-text-dark-main',
      danger: 'bg-error/10 text-error hover:bg-error/20 border border-error/20',
      glass: 'lglass-liquid lglass-interactive text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]',
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
