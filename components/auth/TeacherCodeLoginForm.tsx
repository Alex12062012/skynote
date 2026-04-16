'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export function TeacherCodeLoginForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [teacherName, setTeacherName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) { setError('Entre ton code professeur'); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/teacher-code-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherCode: code.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Code invalide')
        setLoading(false)
        return
      }

      setTeacherName(data.teacherName)

      // Vérifier l'OTP directement côté client — évite le problème PKCE
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'magiclink',
      })

      if (otpError) {
        setTeacherName('')
        setError('Erreur de connexion. Reessaie.')
        setLoading(false)
        return
      }

      // Connexion réussie → dashboard
      router.push('/dashboard')
    } catch {
      setError('Erreur de connexion. Reessaie.')
      setLoading(false)
    }
  }

  if (teacherName) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="text-3xl">👋</span>
        <p className="font-body text-[15px] font-semibold text-text-main dark:text-text-dark-main">
          Bonjour, {teacherName} !
        </p>
        <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
          Connexion en cours...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="teacher-code"
        type="text"
        label="Mon code professeur"
        placeholder="ex: PROF0042"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
        error={error}
      />
      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Acceder a mon tableau de bord
      </Button>
    </form>
  )
}
