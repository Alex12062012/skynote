'use client'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SubjectSelect } from './SubjectSelect'
import { SourceTypeTabs } from './SourceTypeTabs'
import { FileDropzone } from './FileDropzone'
import { VoiceRecorder } from './VoiceRecorder'
import { createCourse } from '@/lib/supabase/course-actions'
import { X, AlertTriangle, Camera } from 'lucide-react'

type SourceType = 'text' | 'pdf' | 'photo' | 'vocal'

const PHOTO_WARNING_KEY = 'skynote_hide_photo_warning'

export function CreateCourseForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('text')
  const [textContent, setTextContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [limitReached, setLimitReached] = useState(false)

  // Photo states
  const [showPhotoWarning, setShowPhotoWarning] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [showExtracted, setShowExtracted] = useState(false)

  function handleSourceTypeChange(v: string) {
    const type = v as SourceType
    setSourceType(type)
    setExtractedText('')
    setShowExtracted(false)
    setFile(null)
    setErrors({})

    // Afficher le popup dès la sélection de Photo
    if (type === 'photo') {
      const hideWarning = localStorage.getItem(PHOTO_WARNING_KEY) === 'true'
      if (!hideWarning) setShowPhotoWarning(true)
    }
  }

  async function extractTextFromPhoto(photoFile: File) {
    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('file', photoFile)
      const res = await fetch('/api/extract-photo', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.text) {
        setExtractedText(data.text)
        setShowExtracted(true)
      } else {
        setErrors({ file: 'Impossible de lire la photo. Essaie avec une meilleure qualité ou saisis le texte manuellement.' })
      }
    } catch {
      setErrors({ file: 'Erreur lors de la lecture de la photo.' })
    }
    setExtracting(false)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Le titre est requis'
    if (!subject) e.subject = 'La matière est requise'
    if (sourceType === 'text' && !textContent.trim()) e.content = 'Le contenu est requis'
    if (sourceType === 'photo' && !extractedText.trim()) e.file = 'Uploade une photo et attends la transcription'
    if (sourceType === 'pdf' && !file) e.file = 'Le fichier est requis'
    if (sourceType === 'vocal' && !voiceTranscript.trim()) e.content = 'Enregistre du contenu vocal'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', title)
      formData.set('subject', subject)
      formData.set('sourceType', sourceType)

      if (sourceType === 'text') formData.set('content', textContent)
      else if (sourceType === 'vocal') formData.set('content', voiceTranscript)
      else if (sourceType === 'photo') formData.set('content', extractedText)
      else if (file) formData.set('content', `[Fichier: ${file.name} — ${Math.round(file.size / 1024)} Ko]\n\nTraitement en cours...`)

      const { courseId, error } = await createCourse(formData)

      if (error || !courseId) {
        if (error?.startsWith('LIMIT:')) {
          setErrors({ form: error.replace('LIMIT:', '') })
          setLimitReached(true)
        } else {
          setErrors({ form: error ?? 'Erreur lors de la création' })
        }
        return
      }

      // Lancer la génération sans attendre (fire and forget)
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      }).catch(console.error)

      // Rediriger immédiatement vers la page de chargement
      router.push(`/courses/${courseId}`)
    })
  }

  return (
    <>
      {/* ── Pop-up conseil photo ── */}
      {showPhotoWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-card-login border border-sky-border bg-sky-surface p-6 shadow-2xl dark:border-night-border dark:bg-night-surface">

            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/30">
                <Camera className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-display text-[17px] font-bold text-text-main dark:text-text-dark-main leading-snug">
                Conseil pour les photos 📸
              </h3>
            </div>

            <div className="mb-4 rounded-input border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-950/20">
              <p className="font-body text-[13px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Pour les photos, <strong>privilégie les cours imprimés</strong> car l'IA a du mal à lire les cours manuscrits
                — surtout les cours d'espagnol écrits à Larache à la dernière minute 😉
              </p>
            </div>

            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mb-5 leading-relaxed">
              Si l'IA n'arrive pas à lire ta photo, tu pourras modifier le texte détecté avant de valider.
              Tu peux aussi supprimer ce cours et le dicter en vocal — ça marche souvent mieux !
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1"
                onClick={() => { setShowPhotoWarning(false); setSourceType('text') }}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={() => setShowPhotoWarning(false)}>
                OK, continuer
              </Button>
            </div>

            <button
              onClick={() => { localStorage.setItem(PHOTO_WARNING_KEY, 'true'); setShowPhotoWarning(false) }}
              className="mt-3 w-full text-center font-body text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Ne plus afficher pour les prochains cours
            </button>
          </div>
        </div>
      )}

      {/* ── Extraction en cours ── */}
      {extracting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-4 rounded-card-login bg-sky-surface p-8 shadow-2xl dark:bg-night-surface">
            <div className="h-10 w-10 rounded-full border-[3px] border-brand border-t-transparent animate-spin dark:border-brand-dark" />
            <p className="font-display text-[16px] font-bold text-text-main dark:text-text-dark-main">
              Lecture de ta photo...
            </p>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              L'IA analyse et transcrit ton cours ✨
            </p>
          </div>
        </div>
      )}

      {/* ── Formulaire ── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          id="title" label="Titre du cours"
          placeholder="Ex: Les fonctions — Mathématiques"
          value={title} onChange={(e) => setTitle(e.target.value)}
          error={errors.title} required
        />

        <SubjectSelect value={subject} onChange={setSubject} error={errors.subject} />

        <div>
          <SourceTypeTabs value={sourceType} onChange={handleSourceTypeChange} />
        </div>

        {/* Texte */}
        {sourceType === 'text' && (
          <div>
            <label className="mb-1.5 block font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
              Contenu du cours
            </label>
            <textarea
              value={textContent} onChange={(e) => setTextContent(e.target.value)}
              placeholder="Colle ou tape ton cours ici..."
              rows={8}
              className="w-full resize-none rounded-input border border-sky-border bg-sky-surface px-4 py-3 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark"
            />
            {errors.content && <p className="mt-1 font-body text-[12px] text-error">{errors.content}</p>}
          </div>
        )}

        {/* Photo — dropzone puis texte extrait */}
        {sourceType === 'photo' && !showExtracted && (
          <div>
            <FileDropzone
              accept="image/*" label="Photo du cours"
              value={file}
              onChange={(f) => { setFile(f); if (f) extractTextFromPhoto(f) }}
              error={errors.file}
            />
          </div>
        )}

        {sourceType === 'photo' && showExtracted && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
                ✅ Texte détecté — tu peux le modifier
              </label>
              <button type="button"
                onClick={() => { setShowExtracted(false); setExtractedText(''); setFile(null) }}
                className="flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-error transition-colors">
                <X className="h-3.5 w-3.5" /> Changer la photo
              </button>
            </div>
            <textarea
              value={extractedText} onChange={(e) => setExtractedText(e.target.value)}
              rows={10}
              className="w-full resize-none rounded-input border border-emerald-300 bg-emerald-50/30 px-4 py-3 font-body text-[14px] text-text-main focus:border-brand focus:outline-none dark:border-emerald-800/40 dark:bg-emerald-950/10 dark:text-text-dark-main"
            />
            {extractedText.includes('[illisible]') && (
              <div className="mt-2 flex items-start gap-2 rounded-input border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/30 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <p className="font-body text-[12px] text-amber-700 dark:text-amber-400">
                  Certaines parties sont marquées [illisible]. Tu peux les corriger avant de valider.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PDF */}
        {sourceType === 'pdf' && (
          <FileDropzone accept=".pdf" label="PDF du cours" value={file} onChange={setFile} error={errors.file} />
        )}

        {/* Vocal */}
        {sourceType === 'vocal' && (
          <VoiceRecorder value={voiceTranscript} onChange={setVoiceTranscript} error={errors.content} />
        )}

        {/* Limite atteinte */}
        {limitReached && errors.form && (
          <div className="rounded-input border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-950/20">
            <p className="font-body text-[13px] text-amber-800 dark:text-amber-300">{errors.form}</p>
            <a href="/pricing" className="mt-2 inline-block font-body text-[13px] font-semibold text-brand hover:underline dark:text-brand-dark">
              Passer au plan Plus pour des cours illimités →
            </a>
          </div>
        )}

        {errors.form && !limitReached && (
          <p className="font-body text-[13px] text-error">{errors.form}</p>
        )}

        <Button type="submit" loading={isPending} size="lg" className="w-full"
          disabled={sourceType === 'photo' && !showExtracted}>
          {isPending ? 'Génération en cours...' : 'Créer le cours ✨'}
        </Button>
      </form>
    </>
  )
}
