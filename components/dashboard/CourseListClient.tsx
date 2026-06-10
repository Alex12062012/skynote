'use client'

import { useMemo, useState } from 'react'
import { CourseCard } from './CourseCard'
import { SubjectBadge } from '@/components/ui/Badge'
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/translations'
import type { Course } from '@/types/database'

type SortKey = 'date' | 'alpha' | 'mastery' | 'subject'

interface Group {
  key: string
  label: string
  isSubject?: boolean
  courses: Course[]
}

interface CourseListClientProps {
  courses: Course[]
}

const DATE_LOCALES: Record<Locale, string> = {
  fr: 'fr-FR', en: 'en-US', ru: 'ru-RU', zh: 'zh-CN',
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getDateGroupLabel(dateStr: string, locale: Locale, t: (key: string) => string) {
  const date = new Date(dateStr)
  const now = new Date()
  if (isSameDay(date, now)) return t('courses.groupToday')
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) return t('courses.groupYesterday')
  return date.toLocaleDateString(DATE_LOCALES[locale] || 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getMasteryGroup(progress: number, t: (key: string) => string): { rank: number; label: string } {
  if (progress <= 0) return { rank: 0, label: t('courses.masteryNotStarted') }
  if (progress < 50) return { rank: 1, label: t('courses.masteryLow') }
  if (progress < 90) return { rank: 2, label: t('courses.masteryMid') }
  return { rank: 3, label: t('courses.masteryHigh') }
}

export function CourseListClient({ courses }: CourseListClientProps) {
  const { t, locale } = useI18n()
  const [sortBy, setSortBy] = useState<SortKey>('date')

  const groups = useMemo<Group[]>(() => {
    const arr = [...courses]

    if (sortBy === 'alpha') {
      arr.sort((a, b) => a.title.localeCompare(b.title, locale))
      const map = new Map<string, Group>()
      for (const c of arr) {
        const letter = c.title.trim().charAt(0).toUpperCase() || '#'
        if (!map.has(letter)) map.set(letter, { key: letter, label: letter, courses: [] })
        map.get(letter)!.courses.push(c)
      }
      return Array.from(map.values())
    }

    if (sortBy === 'mastery') {
      arr.sort((a, b) => a.progress - b.progress)
      const map = new Map<number, Group>()
      for (const c of arr) {
        const g = getMasteryGroup(c.progress, t)
        if (!map.has(g.rank)) map.set(g.rank, { key: String(g.rank), label: g.label, courses: [] })
        map.get(g.rank)!.courses.push(c)
      }
      return Array.from(map.values()).sort((a, b) => Number(a.key) - Number(b.key))
    }

    // 'subject' et 'date' (par défaut) partent toutes deux d'un tri par date d'ajout décroissante
    arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (sortBy === 'subject') {
      const map = new Map<string, Group>()
      for (const c of arr) {
        if (!map.has(c.subject)) map.set(c.subject, { key: c.subject, label: c.subject, isSubject: true, courses: [] })
        map.get(c.subject)!.courses.push(c)
      }
      return Array.from(map.values())
    }

    // date
    const map = new Map<string, Group>()
    for (const c of arr) {
      const label = getDateGroupLabel(c.created_at, locale, t)
      if (!map.has(label)) map.set(label, { key: label, label, courses: [] })
      map.get(label)!.courses.push(c)
    }
    return Array.from(map.values())
  }, [courses, sortBy, locale, t])

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

      {groups.map((g) => (
        <div key={g.key}>
          <div className="mb-4 flex items-center gap-3">
            {g.isSubject ? (
              <SubjectBadge subject={g.label} />
            ) : (
              <span className="font-display text-[15px] font-bold text-text-main dark:text-text-dark-main">{g.label}</span>
            )}
            <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary">
              {t('courses.nCourses').replace('{n}', String(g.courses.length))}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.courses.map((c) => <CourseCard key={c.id} {...c} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
