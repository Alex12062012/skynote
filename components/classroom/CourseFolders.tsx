'use client'

import { useState } from 'react'
import { FolderOpen, Plus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Folder {
  id: string
  name: string
  color: string
  is_default: boolean
  courseCount: number
}

interface CourseFoldersProps {
  folders: Folder[]
  onSelectFolder: (folderId: string) => void
  onCreateFolder?: () => void
  isTeacher?: boolean
}

export function CourseFolders({ folders, onSelectFolder, onCreateFolder, isTeacher }: CourseFoldersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">Dossiers</h2>
        {isTeacher && onCreateFolder && (
          <button onClick={onCreateFolder}
            className="flex items-center gap-1.5 rounded-input bg-brand/10 px-3 py-1.5 font-body text-[13px] font-medium text-brand hover:bg-brand/20 dark:bg-brand-dark/10 dark:text-brand-dark dark:hover:bg-brand-dark/20 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Nouveau dossier
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((f) => (
          <button key={f.id} onClick={() => onSelectFolder(f.id)}
            className="group flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card transition-all hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: f.color + '20' }}>
              <FolderOpen className="h-5 w-5" style={{ color: f.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main truncate group-hover:text-brand dark:group-hover:text-brand-dark transition-colors">
                {f.name}
              </p>
              <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                {f.courseCount} cours
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}