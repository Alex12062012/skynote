'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

const DEMO_ACCOUNTS: Record<string, { email: string; password: string }> = {
  mdubois253912: { email: 'demo-teacher@skynote.app', password: 'DemoTeacher253912!' },
  aroudaut253912: { email: 'demo-student@skynote.app', password: 'DemoStudent253912!' },
}

export function DemoLoginForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toLowerCase()
    const account = DEMO_ACCOUNTS[trimmed]
    if (!account) { setError('Code invalide. Essaie mdubois253912 ou aroudaut253912'); return }
    setError(''); setLoading(true)

    try {
      // 1. Appeler l'API pour créer le compte + la classe si besoin
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (!res.ok && data.error !== 'already_exists') {
        setError(data.error || 'Erreur')
        setLoading(false)
        return
      }

      // 2. Se connecter côté CLIENT (cookie navigateur)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      })

      if (signInError) {
        setError('Erreur connexion : ' + signInError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erreur de connexion')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="demo-code"
        type="text"
        label="Code de connexion"
        placeholder="ex: aroudaut253912"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
        error={error}
      />
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Entrer
      </Button>
    </form>
  )
}
