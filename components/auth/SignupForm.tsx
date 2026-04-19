'use client'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { OtpForm } from './OtpForm'
import { ReferralInput } from './ReferralInput'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const GRADES = [
  { value: '6eme', label: '6eme' },
  { value: '5eme', label: '5eme' },
  { value: '4eme', label: '4eme' },
  { value: '3eme', label: '3eme' },
  { value: '2nde', label: '2nde' },
  { value: '1ere', label: '1ere' },
  { value: 'terminale', label: 'Terminale' },
  { value: 'autre', label: 'Autre' },
]

export function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [rgpdAccepted, setRgpdAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const supabase = createClient()

  const age = useMemo(() => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let a = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--
    return a
  }, [birthDate])

  const isMinor = age !== null && age < 15
  const showGrade = age !== null && age >= 10 && age <= 20

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!birthDate) { setError('La date de naissance est requise'); return }
    if (age !== null && age < 10) { setError('Tu dois avoir au moins 10 ans pour utiliser Skynote'); return }
    if (isMinor && !parentEmail.trim()) { setError("L'email d'un parent est requis pour les moins de 15 ans"); return }
    if (isMinor && parentEmail.trim() === email.trim()) { setError("L'email du parent doit etre different du tien"); return }
    if (!rgpdAccepted) { setError('Tu dois accepter les conditions pour continuer'); return }
    setError(''); setLoading(true)

    const signupEmail = isMinor ? parentEmail.trim() : email.trim()

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: signupEmail,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: name,
          referral_code: referralCode || null,
          birth_date: birthDate,
          grade_level: gradeLevel || null,
          parent_email: isMinor ? parentEmail.trim() : null,
          terms_accepted_at: new Date().toISOString(),
          terms_version: '1.2',
        },
      },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    setOtpSent(true); setLoading(false)
  }

  if (otpSent) {
    const targetEmail = isMinor ? parentEmail.trim() : email.trim()
    return (
      <div className="flex flex-col gap-4">
        {isMinor && (
          <div className="rounded-input bg-brand-soft/30 border border-brand/10 p-4 dark:bg-brand-dark-soft/30 dark:border-brand-dark/10">
            <p className="font-body text-[13px] text-brand dark:text-brand-dark font-medium mb-1">Code envoye au parent</p>
            <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
              Un code à 6 chiffres a été envoyé à <strong>{parentEmail}</strong>. En transmettant ce code à votre enfant, vous autorisez son inscription et acceptez les{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">CGU</a>
              , la{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">politique de confidentialité</a>
              {' '}et les{' '}
              <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">mentions légales</a>
              {' '}de Skynote au nom de votre enfant (art. 8 RGPD).
            </p>
          </div>
        )}
        <OtpForm email={targetEmail} onBack={() => setOtpSent(false)} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input id="name" type="text" label="Prenom" placeholder="Louis"
        value={name} onChange={(e) => setName(e.target.value)} required />

      <Input id="birth-date" type="date" label="Date de naissance"
        value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required
        max={new Date().toISOString().split('T')[0]} />

      {age !== null && age >= 10 && (
        <>
          {isMinor ? (
            <div className="rounded-input bg-amber-50 border border-amber-200 p-4 dark:bg-amber-950/20 dark:border-amber-800/30">
              <p className="font-body text-[13px] text-amber-800 dark:text-amber-300 font-medium mb-2">
                Tu as moins de 15 ans
              </p>
              <p className="font-body text-[12px] text-amber-700 dark:text-amber-400 mb-3">
                Un de tes parents doit autoriser ton inscription. Entre son adresse email : il recevra un code a te donner pour te connecter.
              </p>
              <Input id="parent-email" type="email" label="Email d'un parent"
                placeholder="parent@exemple.com"
                value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required />
            </div>
          ) : (
            <Input id="email" type="email" label="Email" placeholder="toi@exemple.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          )}

          {showGrade && (
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
                Ta classe
              </label>
              <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
                className={cn(
                  'h-11 w-full appearance-none rounded-input border border-sky-border bg-sky-surface px-4 font-body text-[14px] text-text-main transition-all',
                  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15',
                  'dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark',
                  !gradeLevel && 'text-text-tertiary dark:text-text-dark-tertiary'
                )}>
                <option value="">Choisir ta classe...</option>
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          )}

          <ReferralInput value={referralCode} onChange={setReferralCode} />

          {isMinor ? (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={rgpdAccepted} onChange={(e) => setRgpdAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-sky-border accent-brand dark:accent-brand-dark" />
              <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                J'ai obtenu l'autorisation d'un parent ou représentant légal et j'accepte les{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">CGU</a>
                {', '}la{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">politique de confidentialité</a>
                {' '}et les{' '}
                <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">mentions légales</a>
                {' '}de Skynote (v1.2).
              </span>
            </label>
          ) : (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={rgpdAccepted} onChange={(e) => setRgpdAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-sky-border accent-brand dark:accent-brand-dark" />
              <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                J'ai lu et j'accepte les{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">CGU</a>
                {', '}la{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">politique de confidentialité</a>
                {' '}et les{' '}
                <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline dark:text-brand-dark">mentions légales</a>
                {' '}de Skynote (v1.2).
              </span>
            </label>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            {isMinor ? "Envoyer le code a mon parent" : "Recevoir le code de verification"}
          </Button>
        </>
      )}

      {age !== null && age < 10 && (
        <div className="rounded-input bg-error/10 border border-error/20 p-4">
          <p className="font-body text-[13px] text-error font-medium">
            Tu dois avoir au moins 10 ans pour utiliser Skynote.
          </p>
        </div>
      )}

      {error && <p className="font-body text-[13px] text-error text-center">{error}</p>}
    </form>
  )
}