'use client'
import { useState } from 'react'
import { Users, Copy, Check } from 'lucide-react'

interface ClassroomPanelProps {
  classCode: string
  students: { firstName: string; lastName: string; loginCode: string }[]
}

export function ClassroomPanel({ classCode, students }: ClassroomPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-card bg-sky-surface p-6 shadow-card dark:bg-night-surface">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
            <Users className="h-5 w-5 text-brand dark:text-brand-dark" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">
              Ma classe
            </h2>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              {students.length} élève{students.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-input bg-brand-soft/50 dark:bg-brand-dark-soft/50 px-3 py-1.5">
          <span className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">Code :</span>
          <span className="font-display text-[16px] font-bold tracking-wider text-brand dark:text-brand-dark">
            {classCode}
          </span>
          <button onClick={() => copyToClipboard(classCode)}
            className="rounded-input p-1 text-text-secondary hover:bg-sky-cloud dark:hover:bg-night-border transition-colors">
            {copied === classCode ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {students.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-input bg-sky-bg px-3 py-2 dark:bg-night-bg">
            <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
              {s.firstName} {s.lastName}
            </span>
            <div className="flex items-center gap-2">
              <code className="font-mono text-[12px] text-text-secondary dark:text-text-dark-secondary">
                {s.loginCode}
              </code>
              <button onClick={() => copyToClipboard(s.loginCode)}
                className="rounded-input p-1 text-text-secondary hover:bg-sky-cloud dark:hover:bg-night-border transition-colors">
                {copied === s.loginCode ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
