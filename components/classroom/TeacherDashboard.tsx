'use client'

import { useState } from 'react'
import { BookOpen, Key, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeacherTabsProps {
  children: {
    courses: React.ReactNode
    classCode: React.ReactNode
    payment: React.ReactNode
  }
}

const TABS = [
  { id: 'courses', label: 'Cours', icon: BookOpen },
  { id: 'classCode', label: 'Code de classe', icon: Key },
  { id: 'payment', label: 'Paiement', icon: CreditCard },
] as const

type TabId = typeof TABS[number]['id']

export function TeacherDashboard({ children }: TeacherTabsProps) {
  const [tab, setTab] = useState<TabId>('courses')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-card bg-sky-surface p-1 shadow-card dark:bg-night-surface dark:shadow-card-dark">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-input px-4 py-2.5 font-body text-[14px] font-medium transition-all',
              tab === t.id
                ? 'bg-brand text-white shadow-sm dark:bg-brand-dark'
                : 'text-text-secondary hover:bg-sky-cloud dark:text-text-dark-secondary dark:hover:bg-night-border'
            )}>
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
      <div>
        {tab === 'courses' && children.courses}
        {tab === 'classCode' && children.classCode}
        {tab === 'payment' && children.payment}
      </div>
    </div>
  )
}