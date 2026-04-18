'use client'

import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function AddTeacherForm({ classroomId }: { classroomId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleAdd() {
    if (!name.trim() || !email.trim()) { setError('Nom et email requis'); return }
    setLoading(true); setError(''); setSuccess(false)
    try {
      const res = await fetch('/api/classroom/add-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId, name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur'); setLoading(false); return }
      setSuccess(true); setName(''); setEmail('')
      setTimeout(() => window.location.reload(), 1500)
    } catch { setError('Erreur reseau') }
    setLoading(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-body text-[13px] font-medium text-brand hover:text-brand/80 dark:text-brand-dark dark:hover:text-brand-dark/80 transition-colors">
        <UserPlus className="h-4 w-4" /> Ajouter un professeur
      </button>
    )
  }

  return (
    <div className="border-t border-sky-border/50 dark:border-night-border/50 pt-4 space-y-3">
      <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">Ajouter un professeur</p>
      <Input id="teacher-add-name" type="text" label="Nom" placeholder="Marie Dupont"
        value={name} onChange={(e) => setName(e.target.value)} />
      <Input id="teacher-add-email" type="email" label="Email" placeholder="prof@ecole.fr"
        value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
      {success && <p className="font-body text-[13px] text-success font-medium">Professeur ajoute !</p>}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
        <Button onClick={handleAdd} loading={loading} className="flex-1 gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
      </div>
    </div>
  )
}