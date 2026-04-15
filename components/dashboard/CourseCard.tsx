'use client'

import Link from 'next/link'
import { Clock, FileText, File, Camera, Mic } from 'lucide-react'
import { SubjectBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface CourseCardProps {
  id: string
  title: string
  subject: string
  color: string
  status: string
  progress: number
  created_at: string
  source_type: string
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  text:  <FileText className="h-3.5 w-3.5" />,
  pdf:   <File className="h-3.5 w-3.5" />,
  photo: <Camera className="h-3.5 w-3.5" />,
  vocal: <Mic className="h-3.5 w-3.5" />,
}

export function CourseCard({ id, title, subject, color, status, progress, created_at, source_type, studentProgress }: CourseCardProps) {
  const { t } = useI18n()
  const isReady = status === 'ready'
  const isError = status === 'error'

  return (
    <Link
      href={`/courses/${id}`}
      className="group flex flex-col gap-3 rounded-card border border-sky-border bg-sky-surface p-4 sm:p-5 shadow-card transition-all duration-150 hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SubjectBadge subject={subject} />
            {SOURCE_ICONS[source_type] && (
              <span className="text-text-tertiary dark:text-text-dark-tertiary">
                {SOURCE_ICONS[source_