'use client'

import { useState } from 'react'
import { BookOpen, Key, CreditCard, Plus, Copy, Check, Users } from 'lucide-react'
import { CourseFolders } from './CourseFolders'
import { PaymentTab } from './PaymentTab'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  classroom: any
  folders: any[]
  students: any[]
  teachers: any[]
  settings: any
  siteUrl: string
}

const TABS = [
  { id: 'courses' as const, label: 'Cours', icon: BookOpen },
  { id: 'classCode' as const, label: 'Code de classe', icon: Key },
  { id: 'payment' as const, label: 'Paiement', icon: CreditCard },
]

type TabId = typeof TABS[number]['id']

export function TeacherDashboardClient({ classroom, folders, students, teachers, settings, siteUrl }: Props) {
  const [tab, setTab] = useState<TabId>('courses')
  const [copied, setCopied] = useState<string | null>(null)

  function copyToClipboard(text: string) {
    try { navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea'); ta.value = text
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(text); setTimeout(() => setCopied(null), 2000)
  }

  const loginUrl = `${siteUrl}/classroom-login`

  return (
    <div className="flex flex-col gap-6">
      {/* Onglets */}
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

      {/* ONGLET COURS */}
      {tab === 'courses' && (
        <CourseFolders
          folders={folders.map((f: any) => ({
            id: f.id,
            name: f.name,
            color: f.color,
            is_default: f.is_default,
            courseCount: f.courseCount,
          }))}
          onSelectFolder={(folderId) => {
            window.location.href = `/courses?folder=${folderId}&classroom=${classroom.id}`
          }}
          onCreateFolder={() => {
            // TODO: modal creation dossier
          }}
          isTeacher={true}
        />
      )}

      {/* ONGLET CODE DE CLASSE */}
      {tab === 'classCode' && (
        <div className="flex flex-col gap-5">
          {/* Instructions */}
          <div className="rounded-card bg-brand-soft/30 border border-brand/10 p-5 dark:bg-brand-dark-soft/30 dark:border-brand-dark/10">
            <h3 className="font-display text-[15px] font-semibold text-brand dark:text-brand-dark mb-2">
              Comment les eleves accedent a la classe
            </h3>
            <div className="space-y-2 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              <p>1. L'eleve va sur <span className="font-medium text-brand dark:text-brand-dark">{loginUrl}</span></p>
              <p>2. Il tape son code personnel (voir colonne "Code" ci-dessous)</p>
              <p>3. Il accede directement aux cours et QCM de la classe</p>
            </div>
            <button onClick={() => copyToClipboard(loginUrl)}
              className="mt-3 flex items-center gap-2 rounded-input bg-brand/10 px-3 py-2 font-body text-[13px] font-medium text-brand hover:bg-brand/20 dark:bg-brand-dark/10 dark:text-brand-dark dark:hover:bg-brand-dark/20 transition-colors">
              {copied === loginUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === loginUrl ? 'Copie !' : 'Copier le lien de connexion'}
            </button>
          </div>

          {/* Liste des eleves */}
          <div className="rounded-card bg-sky-surface p-6 shadow-card dark:bg-night-surface">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
                  <Users className="h-5 w-5 text-brand dark:text-brand-dark" />
                </div>
                <div>
                  <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">Eleves</h2>
                  <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                    {students.length} eleve{students.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2 mb-1">
              <span className="font-body text-[11px] font-medium uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary">Eleve</span>
              <span className="font-body text-[11px] font-medium uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary w-20 text-center">Code</span>
            </div>

            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {students.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-input bg-sky-bg px-4 py-3 dark:bg-night-bg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-cloud text-[12px] font-bold text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary">
                      {s.first_name[0]}{s.last_name[0]}
                    </div>
                    <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
                      {s.first_name} {s.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[12px] text-brand dark:text-brand-dark">{s.login_code}</code>
                    <button onClick={() => copyToClipboard(s.login_code)}
                      className="rounded-input p-1.5 text-text-tertiary hover:bg-sky-cloud dark:hover:bg-night-border transition-colors">
                      {copied === s.login_code ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profs de la classe */}
          {teachers.length > 0 && (
            <div className="rounded-card bg-sky-surface p-5 shadow-card dark:bg-night-surface">
              <h3 className="font-display text-[15px] font-semibold text-text-main dark:text-text-dark-main mb-3">
                Professeurs ({teachers.length})
              </h3>
              <div className="space-y-2">
                {teachers.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-input bg-sky-bg px-4 py-2.5 dark:bg-night-bg">
                    <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
                      {(t as any).profiles?.full_name || (t as any).profiles?.email || 'Professeur'}
                    </span>
                    <span className={cn('font-body text-[11px] px-2 py-0.5 rounded-full',
                      t.role === 'owner' ? 'bg-brand/10 text-brand dark:bg-brand-dark/10 dark:text-brand-dark' : 'bg-sky-cloud text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary')}>
                      {t.role === 'owner' ? 'Createur' : 'Membre'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ONGLET PAIEMENT */}
      {tab === 'payment' && <PaymentTab />}
    </div>
  )
}