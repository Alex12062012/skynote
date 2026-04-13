'use client'

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
  // Separate folders with courses (active) from empty ones
  const activeFolders = folders.filter((f) => f.courseCount > 0)
  const emptyFolders = folders.filter((f) => f.courseCount === 0)

  function FolderCard({ f }: { f: Folder }) {
    return (
      <button
        key={f.id}
        onClick={() => onSelectFolder(f.id)}
        className="group flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card transition-all hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30 text-left"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
          style={{ backgroundColor: f.color + '20' }}
        >
          <FolderOpen className="h-5 w-5" style={{ color: f.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main truncate group-hover:text-brand dark:group-hover:text-brand-dark transition-colors">
            {f.name}
          </p>
          <p className={cn(
            'font-body text-[12px]',
            f.courseCount > 0
              ? 'text-text-tertiary dark:text-text-dark-tertiary'
              : 'text-text-tertiary/50 dark:text-text-dark-tertiary/50 italic'
          )}>
            {f.courseCount > 0 ? `${f.courseCount} cours` : 'Vide'}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">Dossiers</h2>
        {isTeacher && onCreateFolder && (
          <button
            onClick={onCreateFolder}
            className="flex items-center gap-1.5 rounded-input bg-brand/10 px-3 py-1.5 font-body text-[13px] font-medium text-brand hover:bg-brand/20 dark:bg-brand-dark/10 dark:text-brand-dark dark:hover:bg-brand-dark/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Nouveau dossier
          </button>
        )}
      </div>

      {/* Active folders (with courses) */}
      {activeFolders.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeFolders.map((f) => (
              <FolderCard key={f.id} f={f} />
            ))}
          </div>
        </div>
      )}

      {/* Empty folders — shown below with visual separator */}
      {emptyFolders.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeFolders.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-px bg-sky-border dark:bg-night-border" />
              <span className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary uppercase tracking-wider">
                Dossiers vides
              </span>
              <div className="flex-1 h-px bg-sky-border dark:bg-night-border" />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {emptyFolders.map((f) => (
              <FolderCard key={f.id} f={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
