'use client'
import { useState } from 'react'
import { Users, Copy, Check } from 'lucide-react'

interface StudentData {
  firstName: string
  lastName: string
  loginCode: string
  qcmCount: number
  bestScore: string | null
  hasPerfect: boolean
}

interface ClassroomPanelProps {
  classCode: string
  students: StudentData[]
  siteUrl: string
}

export function ClassroomPanel({ classCode, students, siteUrl }: ClassroomPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function copyToClipboard(text: string) {
    try {
      navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback pour les contextes non-securises
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(text)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const loginUrl = `${siteUrl}/classroom-login`

  return (
    <div className="flex flex-col gap-5">
      {/* Instructions d'acces */}
      <div className="rounded-card bg-brand-soft/30 border border-brand/10 p-5 dark:bg-brand-dark-soft/30 dark:border-brand-dark/10">
        <h3 className="font-display text-[15px] font-semibold text-brand dark:text-brand-dark mb-2">
          Comment les eleves accedent a la classe
        </h3>
        <div className="space-y-2 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          <p>1. L&apos;eleve va sur <span className="font-medium text-brand dark:text-brand-dark">{loginUrl}</span></p>
          <p>2. Il tape son code personnel (voir colonne &quot;Code&quot; ci-dessous)</p>
          <p>3. Il accede directement aux cours et QCM de la classe</p>
        </div>
        <button
          onClick={() => copyToClipboard(loginUrl)}
          className="mt-3 flex items-center gap-2 rounded-input bg-brand/10 px-3 py-2 font-body text-[13px] font-medium text-brand hover:bg-brand/20 dark:bg-brand-dark/10 dark:text-brand-dark dark:hover:bg-brand-dark/20 transition-colors"
        >
          {copied === loginUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied === loginUrl ? 'Copie !' : 'Copier le lien de connexion'}
        </button>
      </div>

      {/* Panel classe */}
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
                {students.length} eleve{students.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* En-tete tableau */}
        <div className="flex items-center justify-between px-4 py-2 mb-1">
          <span className="font-body text-[11px] font-medium uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary">Eleve</span>
          <div className="flex items-center gap-6">
            <span className="font-body text-[11px] font-medium uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary w-16 text-center">QCM</span>
            <span className="font-body text-[11px] font-medium uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary w-20 text-center">Meilleur</span>
            <span className="font-body text-[11px] font-medium uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary w-16 text-center">Code</span>
          </div>
        </div>

        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {students.map((s) => (
            <div key={s.loginCode} className="flex items-center justify-between rounded-input bg-sky-bg px-4 py-3 dark:bg-night-bg">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${s.qcmCount > 0 ? 'bg-success/10 text-success' : 'bg-sky-cloud text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary'}`}>
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
                  {s.firstName} {s.lastName}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary w-16 text-center">
                  {s.qcmCount > 0 ? s.qcmCount : '\u2014'}
                </span>
                <span className={`font-body text-[13px] font-medium w-20 text-center ${s.bestScore ? 'text-success' : 'text-text-tertiary dark:text-text-dark-tertiary'}`}>
                  {s.bestScore || '\u2014'}
                  {s.hasPerfect && ' \u2B50'}
                </span>
                <div className="w-16 flex justify-center">
                  <button onClick={() => copyToClipboard(s.loginCode)}
                    className="rounded-input p-1.5 text-text-tertiary hover:bg-sky-cloud dark:hover:bg-night-border transition-colors"
                    title={s.loginCode}>
                    {copied === s.loginCode ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
