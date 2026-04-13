'use client'

import { useState } from 'react'
import { FolderOpen, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { SubjectBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

// Colors per subject
const SUBJECT_COLORS: Record<string, string> = {
  'Mathématiques': '#2563EB',
  'Mathematiques': '#2563EB',
  'Français': '#DC2626',
  'Francais': '#DC2626',
  'Histoire-Géographie': '#D97706',
  'Histoire-Geographie': '#D97706',
  'Anglais': '#0891B2',
  'Sciences (SVT)': '#059669',
  'Physique-Chimie': '#7C3AED',
  'Philosophie': '#E11D48',
  'Économie (SES)': '#F59E0B',
  'Economie (SES)': '#F59E0B',
  'Informatique (NSI)': '#6D28D9',
  'Sport (EPS)': '#16A34A',
  'Arts': '#EC4899',
  'Autre': '#64748B',
}

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? '#2563EB'
}

interface EnrichedCourse {
  id: string
  title: string
  subject: string
  color: string
  status: string
  progress: number
  created_at: string
  source_type: string
  isNew: boolean
  isDone: boolean
}

interface StudentCourseFoldersProps {
  subjects: [string, EnrichedCourse[]][]
}

export function StudentCourseFolders({ subjects }: StudentCourseFoldersProps) {
  const [openSubject, setOpenSubject] = useState<string | null>(null)

  const selectedEntry = subjects.find(([sub]) => sub === openSubject)
  const selectedCourses = selectedEntry ? selectedEntry[1] : []

  // Sort courses: not-done first, then done
  const sortedCourses = [...selectedCourses].sort((a, b) => {
    if (a.isDone === b.isDone) return 0
    return a.isDone ? 1 : -1
  })

  if (openSubject && selectedEntry) {
    const color = getSubjectColor(openSubject)
    const hasNewCourse = selectedCourses.some((c) => c.isNew)

    return (
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => setOpenSubject(null)}
          className="flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux matières
        </button>

        {/* Folder header */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: color + '20' }}
          >
            <FolderOpen className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">{openSubject}</h2>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              {selectedCourses.length} cours
              {hasNewCourse && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-pill bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  🔴 Nouveau
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Section: not done */}
        {sortedCourses.filter((c) => !c.isDone).length > 0 && (
          <div className="flex flex-col gap-2">
            {sortedCourses.filter((c) => !c.isDone).length < sortedCourses.length && (
              <p className="font-body text-[12px] font-semibold text-text-tertiary dark:text-text-dark-tertiary uppercase tracking-wider">
                À faire
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedCourses.filter((c) => !c.isDone).map((c) => (
                <div key={c.id} className="relative">
                  {c.isNew && (
                    <div className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-md">
                      <span className="text-[9px] font-bold text-white">N</span>
                    </div>
                  )}
                  <CourseCard {...c} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: done */}
        {sortedCourses.filter((c) => c.isDone).length > 0 && (
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
              {sortedCourses.filter((c) => c.isDone).map((c) => (
                <CourseCard key={c.id} {...c} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Folder list view ──
  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map(([subject, courses]) => {
          const color = getSubjectColor(subject)
          const hasNew = courses.some((c) => c.isNew)
          const doneCount = courses.filter((c) => c.isDone).length

          return (
            <button
              key={subject}
              onClick={() => setOpenSubject(subject)}
              className="group relative flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card transition-all hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30 text-left"
            >
              {/* Red badge for new courses */}
              {hasNew && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-md animate-pulse">
                  <span className="text-[9px] font-bold text-white">!</span>
                </div>
              )}

              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: color + '20' }}
              >
                <FolderOpen className="h-5 w-5" style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main truncate group-hover:text-brand dark:group-hover:text-brand-dark transition-colors">
                  {subject}
                </p>
                <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                  {courses.length} cours
                  {doneCount > 0 && (
                    <span className="ml-1 text-success dark:text-success-dark">· {doneCount} fait{doneCount > 1 ? 's' : ''}</span>
                  )}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
