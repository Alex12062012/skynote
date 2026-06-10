'use client'

import { useMemo, useState } from 'react'
import { CourseCard } from './CourseCard'
import { SubjectBadge } from '@/components/ui/Badge'
import { useI18n } from '@/lib/i18n/context'
import type { Course } from '@/types/database'

type SortKey = 'date' | 'alpha' | 'mastery' | 'subject'

interface CourseListClientProps {
  courses: Course[]
}

export function CourseListClient({ courses }: CourseListClientProps) {
  const { t } = useI18n()
  const [sortBy, setSortBy] = useState<SortKey>('date')

  const sorted = useMemo(() => {
    const arr = [...courses]
    switch (sortBy) {
      case 'alpha':
        return arr.sort((a, b) => a.title.localeCompare(b.title))
      case 'mastery':
        return arr.sort((a, b) => a.progress - b.progress)
      case 'date':
      case 'subject':
      default:
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [courses, sortBy])

  const grouped = useMemo(() => {
    return sorted.reduce<Record<string, Course[]>>((acc, c) => {
      if (!acc[c.subject]) acc[c.subject] = []
      acc[c.subject].push(c)
      return acc
    }, {})
  }, [sorted])

  return (
    <div className="flex flex-col gap-6">
      {/* Sélecteur de classement */}
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="course-sort" className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          {t('courses.sortBy')}
        </label>
        <select
          id="course-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="h-9 rounded-input border border-sky-border bg-sky-surface px-3 font-body text-[13px] text-text-main transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark"
        >
          <option value="date">{t('courses.sortDateAdded')}</option>
          <option value="alpha">{t('courses.sortAlphabetical')}</option>
          <option value="mastery">{t('courses.sortLeastMastered')}</option>
          <option value="subject">{t('courses.sortSubject')}</option>
        </select>
      </div>

      {sortBy === 'subject' ? (
        Object.entries(grouped).map(([subject, subjectCourses]) => (
          <div key={subject}>
            <div className="mb-4 flex items-center gap-3">
              <SubjectBadge subject={subject} />
              <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
                {t('courses.nCourses').replace('{n}', String(subjectCourses.length))}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjectCourses.map((c) => <CourseCard key={c.id} {...c} />)}
            </div>
          </div>
        ))
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => <CourseCard key={c.id} {...c} />)}
        </div>
      )}
    </div>
  )
}
