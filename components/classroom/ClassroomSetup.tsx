'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Users, Copy, Check } from 'lucide-react'

interface StudentInput {
  firstName: string
  lastName: string
}

interface CreatedStudent {
  firstName: string
  lastName: string
  loginCode: string
}

export function ClassroomSetup() {
  const [step, setStep] = useState<'count' | 'names' | 'done'>('count')
  const [count, setCount] = useState('')
  const [students, setStudents] = useState<StudentInput[]>([])
  const [classCode, setClassCode] = useState('')
  const [createdStudents, setCreatedStudents] = useState<CreatedStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  function handleCountSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(count)
    if (isNaN(n) || n < 1 || n > 50) { setError('Entre un nombre entre 1 et 50'); return }
    setStudents(Array.from({ length: n }, () => ({ firstName: '', lastName: '' })))
    setError('')
    setStep('names')
  }

  function updateStudent(index: number, field: 'firstName' | 'lastName', value: string) {
    setStudents(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  async function handleNamesSubmit(e: React.FormEvent) {
    e.preventDefault()
    const incomplete = students.some(s => !s.firstName.trim() || !s.lastName.trim())
    if (incomplete) { setError('Remplis le prénom et nom de chaque élève'); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/classroom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur'); setLoading(false); return }
      setClassCode(data.classCode)
      setCreatedStudents(data.students)
      setStep('done')
    } catch {
      setError('Erreur serveur')
    }
    setLoading(false)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  // STEP 1: Nombre d'élèves
  if (step === 'count') {
    return (
      <div className="rounded-card bg-sky-surface p-6 shadow-card dark:bg-night-surface">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
            <Users className="h-5 w-5 text-brand dark:text-brand-dark" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">
              Créer votre classe
            </h2>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Commencez par indiquer le nombre d&apos;élèves
            </p>
          </div>
        </div>
        <form onSubmit={handleCountSubmit} className="flex flex-col gap-4">
          <Input
            id="student-count"
            type="number"
            label="Nombre d'élèves"
            placeholder="ex: 25"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            required
            error={error}
          />
          <Button type="submit" size="lg" className="w-full">
            Continuer
          </Button>
        </form>
      </div>
    )
  }

  // STEP 2: Prénoms et noms
  if (step === 'names') {
    return (
      <div className="rounded-card bg-sky-surface p-6 shadow-card dark:bg-night-surface">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
            <Users className="h-5 w-5 text-brand dark:text-brand-dark" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">
              Vos {students.length} élèves
            </h2>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Entrez le prénom et nom de chaque élève
            </p>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-input bg-error/10 px-4 py-3 font-body text-[13px] text-error border border-error/20">
            {error}
          </div>
        )}
        <form onSubmit={handleNamesSubmit} className="flex flex-col gap-3">
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2 pr-1">
            {students.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-body text-[13px] text-text-tertiary dark:text-text-dark-tertiary w-6 flex-shrink-0 text-right">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={s.firstName}
                  onChange={(e) => updateStudent(i, 'firstName', e.target.value)}
                  className="flex-1 rounded-input border border-sky-border bg-sky-bg px-3 py-2 font-body text-[14px] text-text-main outline-none transition-colors focus:border-brand dark:border-night-border dark:bg-night-bg dark:text-text-dark-main dark:focus:border-brand-dark"
                  required
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={s.lastName}
                  onChange={(e) => updateStudent(i, 'lastName', e.target.value)}
                  className="flex-1 rounded-input border border-sky-border bg-sky-bg px-3 py-2 font-body text-[14px] text-text-main outline-none transition-colors focus:border-brand dark:border-night-border dark:bg-night-bg dark:text-text-dark-main dark:focus:border-brand-dark"
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => { setStep('count'); setError('') }} className="flex-1">
              Retour
            </Button>
            <Button type="submit" loading={loading} size="lg" className="flex-1">
              Créer la classe
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // STEP 3: Résultat
  return (
    <div className="rounded-card bg-sky-surface p-6 shadow-card dark:bg-night-surface">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
          <Check className="h-5 w-5 text-success" />
        </div>
        <div>
          <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">
            Classe créée !
          </h2>
          <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Partagez les codes avec vos élèves
          </p>
        </div>
      </div>

      {/* Code de classe */}
      <div className="mb-5 rounded-input bg-brand-soft/50 dark:bg-brand-dark-soft/50 p-4 text-center">
        <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary mb-1">Code de classe</p>
        <div className="flex items-center justify-center gap-2">
          <span className="font-display text-[28px] font-bold tracking-widest text-brand dark:text-brand-dark">
            {classCode}
          </span>
          <button onClick={() => copyToClipboard(classCode)}
            className="rounded-input p-1.5 text-text-secondary hover:bg-sky-cloud dark:hover:bg-night-border transition-colors">
            {copied === classCode ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Liste des élèves */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {createdStudents.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-input bg-sky-bg px-3 py-2 dark:bg-night-bg">
            <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
              {s.firstName} {s.lastName}
            </span>
            <div className="flex items-center gap-2">
              <code className="font-mono text-[13px] text-brand dark:text-brand-dark">
                {s.loginCode}
              </code>
              <button onClick={() => copyToClipboard(s.loginCode)}
                className="rounded-input p-1 text-text-secondary hover:bg-sky-cloud dark:hover:bg-night-border transition-colors">
                {copied === s.loginCode ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary text-center">
        Les élèves se connectent sur <strong>/classroom-login</strong> avec leur code personnel
      </p>

      <Button onClick={() => { router.push('/dashboard'); router.refresh() }} size="lg" className="w-full mt-4">
        Aller au tableau de bord
      </Button>
    </div>
  )
}
