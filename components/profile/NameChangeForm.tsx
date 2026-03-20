'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NameChangeFormProps {
  currentName: string | null
  nameChangedAt: string | null
}

export function NameChangeForm({ currentName, nameChangedAt }: NameChangeFormProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName || '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  // Vérifier si le changement est possible (1 fois par mois)
  const canChange = () => {
    if (!nameChangedAt) return true
    const lastChange = new Date(nameChangedAt)
    const now = new Date()
    const diffDays = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays >= 30
  }

  const nextChangeDate = () => {
    if (!nameChangedAt) return null
    const lastChange = new Date(nameChangedAt)
    lastChange.setDate(lastChange.getDate() + 30)
    return lastChange.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  function handleSave() {
    if (!name.trim()) { setError('Le prénom ne peut pas être vide'); return }
    if (name.trim().length < 2) { setError('Minimum 2 caractères'); return }
    if (name.trim().length > 30) { setError('Maximum 30 caractères'); return }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          name_changed_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        setError('Erreur lors de la mise à jour')
        return
      }

      setEditing(false)
      setError('')
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        {canChange() ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 font-body text-[12px] text-text-tertiary hover:text-brand dark:hover:text-brand-dark transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Modifier le prénom
          </button>
        ) : (
          <span className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
            Prochain changement le {nextChangeDate()}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="Ton prénom"
          maxLength={30}
          autoFocus
          className="h-9 flex-1 rounded-input border border-sky-border bg-sky-surface px-3 font-body text-[14px] text-text-main focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex h-9 w-9 items-center justify-center rounded-input bg-brand text-white hover:bg-brand-hover disabled:opacity-60 dark:bg-brand-dark dark:text-night-bg"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setEditing(false); setName(currentName || ''); setError('') }}
          className="flex h-9 w-9 items-center justify-center rounded-input border border-sky-border text-text-tertiary hover:text-text-main dark:border-night-border"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="font-body text-[12px] text-error">{error}</p>}
      <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
        Tu pourras changer ton prénom à nouveau dans 30 jours.
      </p>
    </div>
  )
}
