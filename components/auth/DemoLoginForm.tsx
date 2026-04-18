'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export function DemoLoginForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toLowerCase()
    if (!trimmed) { setError('Code invalide'); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Code invalide')
        setLoading(false)
        return
      }

      if (data.email && data.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (signInError) {
          setError('Erreur connexion : ' + signInError.message)
          setLoading(false)
          return
        }
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