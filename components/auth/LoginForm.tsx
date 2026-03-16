'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="email" type="email" label="Email" placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      <Input id="password" type="password" label="Mot de passe" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" error={error} />
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">Se connecter</Button>
    </form>
  )
}
