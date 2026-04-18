'use client'

import { useState, useRef, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { updateCourseTitle } from '@/lib/supabase/course-actions'

interface EditableTitleProps {
  courseId: string
  initialTitle: string
  canEdit: boolean
}

export function EditableTitle({ courseId, initialTitle, canEdit }: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    if (!canEdit) return
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function cancel() {
    setTitle(initialTitle)
    setEditing(false)
  }

  function save() {
    if (!title.trim() || title.trim() === initialTitle) {
      cancel()
      return
    }
    startTransition(async () => {
      const { error } = await updateCourseTitle(courseId, title.trim())
      if (error) {
        setTitle(initialTitle)
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          className="flex-1 rounded-input border border-brand bg-sky-surface px-3 py-1.5 font-display text-h2 text-text-main leading-tight focus:outline-none dark:border-brand-dark dark:bg-night-surface dark:text-text-dark-main"
          disabled={isPending}
        />
        <button onClick={save} disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white hover:bg-success/80 transition-colors">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={cancel}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-cloud text-text-secondary hover:bg-red-100 hover:text-error transition-colors dark:bg-night-border dark:hover:bg-red-950/30">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main leading-tight">
        {title}
      </h1>
      {canEdit && (
        <button onClick={startEdit}
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary opacity-0 transition-all hover:bg-sky-cloud hover:text-text-main group-hover:opacity-100 dark:hover:bg-night-border dark:hover:text-text-dark-main">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
