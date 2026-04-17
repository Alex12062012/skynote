'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const COLORS = ['#2563EB','#DC2626','#D97706','#059669','#16A34A','#7C3AED','#E11D48','#0891B2','#EA580C','#6D28D9','#64748B','#EC4899']

interface Props {
  classroomId: string
  onClose: () => void
  onCreated: () => void
}

export function CreateFolderModal({ classroomId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2563EB')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleCreate() {
    if (!name.trim()) { setError('Nom requis'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/classroom/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId, name: name.trim(), color }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); setLoading(false); return }
      onCreated()
      onClose()
    } catch { setError('Erreur reseau'); setLoading(false) }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-card-login border border-sky-border bg-sky-surface p-6 shadow-2xl dark:border-night-border dark:bg-night-surface">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-[17px] font-bold text-text-main dark:text-text-dark-main">Nouveau dossier</h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-main dark:hover:text-text-dark-main"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <Input id="folder-name" label="Nom du dossier" placeholder="Ex: Mathematiques"
            value={name} onChange={(e) => setName(e.target.value)} error={error} required />
          <div>
            <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main mb-2">Couleur</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: color === c ? '#fff' : 'transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }} />
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} loading={loading} size="lg" className="w-full mt-1">Creer le dossier</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}