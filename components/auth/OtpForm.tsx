'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface OtpFormProps { email: string; onBack: () => void }

export function OtpForm({ email, onBack }: OtpFormProps) {
  const router = useRouter()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const supabase = createClient()

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const token = digits.join('')
    if (token.length !== 6) { setError('Entre les 6 chiffres'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) { setError('Code incorrect ou expiré'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-5">
      <div className="text-center">
        <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Code envoyé à
        </p>
        <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main">
          {email}
        </p>
      </div>

      {/* 6 cases OTP */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-14 w-11 rounded-input border-2 border-sky-border bg-sky-surface text-center font-display text-[22px] font-bold text-text-main transition-all focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark"
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && <p className="text-center font-body text-[13px] text-error">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Vérifier le code
      </Button>

      <button type="button" onClick={onBack}
        className="text-center font-body text-[13px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main">
        ← Changer d'adresse email
      </button>
    </form>
  )
}
