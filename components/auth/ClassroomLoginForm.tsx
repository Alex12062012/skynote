'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export function ClassroomLoginForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) { setError('Entre ton code de connexion'); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/classroom/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginCode: code.trim().toLowerCase() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Code invalide')
        setLoading(false)
        return
      }

      // Authentifier cote client avec les credentials
      if (data.email && data.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (signInError) {
          setError('Erreur de connexion : ' + signInError.message)
          setLoading(false)
          return
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erreur de connexion. Reessaie.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="classroom-code"
        type="text"
        label="Mon code eleve"
        placeholder="ex: aroudaut868663"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
        error={error}
      />
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Entrer dans ma classe
      </Button>
    </form>
  )
}
