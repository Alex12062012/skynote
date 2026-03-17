'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { OtpForm } from './OtpForm'
import { ReferralInput } from './ReferralInput'
import { createClient } from '@/lib/supabase/client'

export function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: name, referral_code: referralCode || null },
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setOtpSent(true); setLoading(false)
  }

  if (otpSent) return <OtpForm email={email} onBack={() => setOtpSent(false)} />

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="name" type="text" label="Prénom" placeholder="Louis"
        value={name} onChange={(e) => setName(e.target.value)} required />
      <Input id="email" type="email" label="Email" placeholder="toi@exemple.com"
        value={email} onChange={(e) => setEmail(e.target.value)} required error={error} />
      <ReferralInput value={referralCode} onChange={setReferralCode} />
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Recevoir le code de vérification
      </Button>
    </form>
  )
}
