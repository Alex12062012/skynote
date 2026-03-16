'use client'
import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileDropzoneProps { accept: string; label: string; onFile: (f: File | null) => void; file: File | null }

export function FileDropzone({ accept, label, onFile, file }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      {file ? (
        <div className="flex items-center justify-between rounded-input border border-brand/30 bg-brand-soft px-4 py-3 dark:border-brand-dark/30 dark:bg-brand-dark-soft">
          <span className="font-body text-[13px] text-brand truncate dark:text-brand-dark">{file.name}</span>
          <button type="button" onClick={() => onFile(null)} className="ml-2 flex-shrink-0 text-text-tertiary hover:text-text-main dark:hover:text-text-dark-main">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed py-10 transition-all',
            dragging ? 'border-brand bg-brand-soft dark:border-brand-dark dark:bg-brand-dark-soft' : 'border-sky-border hover:border-brand/40 dark:border-night-border dark:hover:border-brand-dark/40'
          )}>
          <Upload className="h-8 w-8 text-text-tertiary dark:text-text-dark-tertiary" />
          <div className="text-center">
            <p className="font-body text-[14px] font-medium text-text-main dark:text-text-dark-main">{label}</p>
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary mt-1">ou glisse-dépose ici</p>
          </div>
        </div>
      )}
    </div>
  )
}
