'use client'
<<<<<<< HEAD
=======

>>>>>>> 79e36e2 (fix: dashboard corrigé + landing page et UI pro pour la prod)
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { OtpForm } from './OtpForm'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })

    if (error) {
      if (error.message.includes('Email rate limit exceeded')) {
        setError('Trop de tentatives. Attends quelques minutes avant de réessayer.')
      } else if (
        error.message.includes('Unable to validate') ||
        error.message.includes('User not found') ||
        error.message.includes('Signups not allowed')
      ) {
        setError("Aucun compte avec cet email. Crée un compte d'abord.")
      } else if (
        error.message.includes('SMTP') ||
        error.message.includes('email') ||
        error.message.includes('send')
      ) {
        setError("Erreur d'envoi du mail. Réessaie dans quelques instants.")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setOtpSent(true)
    setLoading(false)
  }

  if (otpSent) return <OtpForm email={email} onBack={() => setOtpSent(false)} />

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="toi@exemple.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        error={error}
      />
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Recevoir le code
      </Button>
    </form>
  )
}
