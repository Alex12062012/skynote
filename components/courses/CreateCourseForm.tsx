'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SubjectSelect } from './SubjectSelect'
import { SourceTypeTabs } from './SourceTypeTabs'
import { FileDropzone } from './FileDropzone'
import { VoiceRecorder } from './VoiceRecorder'
import { createCourse } from '@/lib/supabase/course-actions'

type SourceType = 'text' | 'pdf' | 'photo' | 'vocal'

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

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Le titre est requis'
    if (!subject) e.subject = 'La matière est requise'
    if (sourceType === 'text' && !textContent.trim()) e.content = 'Le contenu est requis'
    if ((sourceType === 'pdf' || sourceType === 'photo') && !file) e.file = 'Le fichier est requis'
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
      else if (file) {
        // Pour PDF/photo : on lit en base64 pour l'IA, ou on extrait le texte côté client
        // Ici on stocke le nom + taille comme contenu temporaire ; le pipeline IA traitera le fichier
        formData.set('content', `[Fichier: ${file.name} — ${Math.round(file.size / 1024)} Ko]\n\nTraitement en cours via l'IA...`)
        // TODO partie 6 : upload réel dans Supabase Storage
      }

      const { courseId, error } = await createCourse(formData)

      if (error || !courseId) {
        setErrors({ form: error ?? 'Erreur lors de la création' })
        return
      }

      router.push(`/courses/${courseId}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {errors.form && (
        <div className="rounded-input border border-error/20 bg-error/10 px-4 py-3 font-body text-[14px] text-error">
          {errors.form}
        </div>
      )}

      <Input
        id="title"
        label="Titre du cours"
        placeholder="Ex : La photosynthèse, Les équations du 2e degré..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        maxLength={120}
      />

      <SubjectSelect value={subject} onChange={setSubject} error={errors.subject} />

      <SourceTypeTabs value={sourceType} onChange={setSourceType} />

      {/* Zone de contenu selon le type */}
      {sourceType === 'text' && (
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
            Colle ou tape ton cours ici
          </label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Colle ton cours, tes notes de classe, un résumé..."
            rows={10}
            className="w-full resize-y rounded-input border border-sky-border bg-sky-surface px-4 py-3 font-body text-[14px] text-text-main placeholder:text-text-tertiary transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:placeholder:text-text-dark-tertiary dark:focus:border-brand-dark"
          />
          {errors.content && <p className="font-body text-[12px] text-error">{errors.content}</p>}
          <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
            {textContent.length} caractères — Plus c'est long, meilleures seront les fiches !
          </p>
        </div>
      )}

      {(sourceType === 'pdf') && (
        <div>
          <FileDropzone
            accept="application/pdf"
            label="Importer un PDF"
            file={file}
            onFile={setFile}
          />
          {errors.file && <p className="mt-1 font-body text-[12px] text-error">{errors.file}</p>}
          <p className="mt-2 font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
            💡 Astuce : Copie le texte du PDF et utilise l'onglet "Texte" pour de meilleurs résultats.
          </p>
        </div>
      )}

      {sourceType === 'photo' && (
        <div>
          <FileDropzone
            accept="image/*"
            label="Importer une photo de cours"
            file={file}
            onFile={setFile}
          />
          {errors.file && <p className="mt-1 font-body text-[12px] text-error">{errors.file}</p>}
        </div>
      )}

      {sourceType === 'vocal' && (
        <div>
          <VoiceRecorder transcript={voiceTranscript} onTranscript={setVoiceTranscript} />
          {errors.content && <p className="mt-1 font-body text-[12px] text-error">{errors.content}</p>}
        </div>
      )}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        {isPending ? 'Création en cours...' : '✨ Générer mes fiches avec l\'IA'}
      </Button>
    </form>
  )
}
