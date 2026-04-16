'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [isOpen, onClose])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-md rounded-card-login bg-sky-surface p-6 shadow-2xl dark:bg-night-surface animate-slide-in', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-h4 text-text-main dark:text-text-dark-main">{title}</h2>
          <button onClick={onClose} className="rounded-input p-1.5 text-text-tertiary hover:bg-sky-cloud hover:text-text-main dark:hover:bg-night-border dark:hover:text-text-dark-main transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
