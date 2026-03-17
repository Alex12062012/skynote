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
  const [rgpdAccepted, setRgpdAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rgpdAccepted) { setError('Tu dois accepter les conditions pour continuer'); setLoading(false); return }
    setError(''); setLoading(true)
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

      {/* Case RGPD */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={rgpdAccepted}
          onChange={(e) => setRgpdAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-sky-border accent-brand dark:accent-brand-dark"
        />
        <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary leading-relaxed">
          J'ai 15 ans ou plus (ou j'ai l'autorisation de mes parents) et j'accepte les{' '}
          <a href="/terms" target="_blank" className="text-brand hover:underline dark:text-brand-dark">CGU</a>
          {' '}et la{' '}
          <a href="/privacy" target="_blank" className="text-brand hover:underline dark:text-brand-dark">politique de confidentialité</a>
          {' '}de Skynote.
        </span>
      </label>
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Recevoir le code de vérification
      </Button>
    </form>
  )
}
