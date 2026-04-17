'use client'

import { useState } from 'react'
import { FolderOpen, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { cn } from '@/lib/utils'

export interface EnrichedCourse {
  id: string
  title: string
  subject: string
  color: string
  status: string
  progress: number
  created_at: string
  source_type: string
  folder_id?: string | null
  isNew: boolean
  isDone: boolean
}

export interface FolderWithCourses {
  id: string
  name: string
  color: string
  courses: EnrichedCourse[]
}

interface StudentCourseFoldersProps {
  folders: FolderWithCourses[]
}

export function StudentCourseFolders({ folders }: StudentCourseFoldersProps) {
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  const selectedFolder = folders.find((f) => f.id === openFolderId)

  if (openFolderId && selectedFolder) {
    const hasNewCourse = selectedFolder.courses.some((c) => c.isNew)

    // Sort: not-done first, then done
    const sortedCourses = [...selectedFolder.courses].sort((a, b) => {
      if (a.isDone === b.isDone) return 0
      return a.isDone ? 1 : -1
    })

    const notDone = sortedCourses.filter((c) => !c.isDone)
    const done = sortedCourses.filter((c) => c.isDone)

    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Back */}
        <button
          onClick={() => setOpenFolderId(null)}
          className="flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux dossiers
        </button>

        {/* Folder header */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: selectedFolder.color + '20' }}
          >
            <FolderOpen className="h-5 w-5" style={{ color: selectedFolder.color }} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">
              {selectedFolder.name}
            </h2>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary flex items-center gap-2">
              {selectedFolder.courses.length} cours
              {hasNewCourse && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  🔴 Nouveau
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Not done courses */}
        {notDone.length > 0 && (
          <div className="flex flex-col gap-2">
            {done.length > 0 && (
              <p className="font-body text-[12px] font-semibold text-text-tertiary dark:text-text-dark-tertiary uppercase tracking-wider">
                À faire
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notDone.map((c) => (
                <div key={c.id} className="relative">
                  {c.isNew && (
                    <div className="absolute -top-1 -right-1 z-10 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />
                  )}
                  <CourseCard {...c} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done courses */}
        {done.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-px bg-sky-border dark:bg-night-border" />
              <span className="flex items-center gap-1 font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary uppercase tracking-wider">
                <CheckCircle className="h-3 w-3 text-success dark:text-success-dark" />
                Déjà faits
              </span>
              <div className="flex-1 h-px bg-sky-border dark:bg-night-border" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
              {done.map((c) => <CourseCard key={c.id} {...c} />)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Folder list ──
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {folders.map((folder) => {
        const hasNew = folder.courses.some((c) => c.isNew)
        const doneCount = folder.courses.filter((c) => c.isDone).length

        return (
          <button
            key={folder.id}
            onClick={() => setOpenFolderId(folder.id)}
            className="group relative flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card transition-all hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30 text-left"
          >
            {hasNew && (
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />
            )}

            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: folder.color + '20' }}
            >
              <FolderOpen className="h-5 w-5" style={{ color: folder.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main truncate group-hover:text-brand dark:group-hover:text-brand-dark transition-colors">
                {folder.name}
              </p>
              <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                {folder.courses.length} cours
                {doneCount > 0 && (
                  <span className="ml-1 text-success dark:text-success-dark">
                    · {doneCount} fait{doneCount > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
          </button>
        )
      })}
    </div>
  )
}
