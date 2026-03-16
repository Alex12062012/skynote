'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ReferralInput } from './ReferralInput'
import { createClient } from '@/lib/supabase/client'
import { applyReferralCode } from '@/lib/supabase/referral-actions'

export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Appliquer le code de parrainage si fourni
    if (referralCode.trim() && data.user) {
      await applyReferralCode(data.user.id, referralCode.trim())
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="name" type="text" label="Prénom" placeholder="Louis"
        value={name} onChange={(e) => setName(e.target.value)} required
      />
      <Input
        id="email" type="email" label="Email" placeholder="toi@exemple.com"
        value={email} onChange={(e) => setEmail(e.target.value)} required
      />
      <Input
        id="password" type="password" label="Mot de passe" placeholder="8 caractères min."
        value={password} onChange={(e) => setPassword(e.target.value)}
        required minLength={8} error={error}
      />
      <ReferralInput value={referralCode} onChange={setReferralCode} />
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Créer mon compte
      </Button>
    </form>
  )
}
