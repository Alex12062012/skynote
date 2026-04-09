'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  classroomId: string
  initialSettings: any
}

export function SettingsToggles({ classroomId, initialSettings }: Props) {
  const [skycoinsEnabled, setSkycoinsEnabled] = useState(initialSettings?.skycoins_enabled ?? true)
  const [skycoinsInRanking, setSkycoinsInRanking] = useState(initialSettings?.skycoins_in_ranking ?? true)
  const [saving, setSaving] = useState(false)

  async function updateSettings(enabled: boolean, inRanking: boolean) {
    setSaving(true)
    try {
      await fetch('/api/classroom/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId, skycoinsEnabled: enabled, skycoinsInRanking: inRanking }),
      })
    } catch {}
    setSaving(false)
  }

  function toggleSkycoins() {
    const next = !skycoinsEnabled
    setSkycoinsEnabled(next)
    if (!next) { setSkycoinsInRanking(false); updateSettings(next, false) }
    else { updateSettings(next, skycoinsInRanking) }
  }

  function toggleRanking() {
    const next = !skycoinsInRanking
    setSkycoinsInRanking(next)
    updateSettings(skycoinsEnabled, next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-[14px] font-medium text-text-main dark:text-text-dark-main">Skycoins actifs</p>
          <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">Les eleves gagnent des Skycoins en faisant les QCM</p>
        </div>
        <button onClick={toggleSkycoins} disabled={saving}
          className={cn('relative h-6 w-11 rounded-full transition-colors', skycoinsEnabled ? 'bg-brand dark:bg-brand-dark' : 'bg-sky-cloud dark:bg-night-border')}>
          <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', skycoinsEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
        </button>
      </div>

      {skycoinsEnabled && (
        <div className="flex items-center justify-between pl-4 border-l-2 border-sky-border dark:border-night-border">
          <div>
            <p className="font-body text-[14px] font-medium text-text-main dark:text-text-dark-main">Apparaitre dans le classement global</p>
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">Les eleves de la classe sont visibles sur skynote.fr/leaderboard</p>
          </div>
          <button onClick={toggleRanking} disabled={saving}
            className={cn('relative h-6 w-11 rounded-full transition-colors', skycoinsInRanking ? 'bg-brand dark:bg-brand-dark' : 'bg-sky-cloud dark:bg-night-border')}>
            <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', skycoinsInRanking ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </div>
      )}
    </div>
  )
}