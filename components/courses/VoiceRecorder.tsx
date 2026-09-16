'use client'
import { useEffect, useState, useRef } from 'react'
import { Mic, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toSpeechLang } from '@/lib/speech-lang'

interface VoiceRecorderProps {
  onTranscript?: (t: string) => void
  onChange?: (t: string) => void
  transcript?: string
  value?: string
  error?: string
  /** Code langue du produit ('fr', 'en', 'auto'…) — langue de reconnaissance */
  lang?: string
}

export function VoiceRecorder({ onTranscript, onChange, transcript, value, error, lang }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [recError, setRecError] = useState('')
  const recognitionRef = useRef<any>(null)
  const finalRef = useRef('')
  // Le navigateur coupe seul la reconnaissance apres un silence (ou ~60 s sur
  // Chrome), sans que l'eleve ait clique stop : on redemarre tant que l'arret
  // n'est pas volontaire.
  const stoppedByUserRef = useRef(false)

  const currentTranscript = transcript ?? value ?? ''
  const handleChange = onTranscript ?? onChange ?? (() => {})

  function start() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setRecError("La reconnaissance vocale n'est pas supportee par ce navigateur."); return }
    const recognition = new SpeechRecognition()
    recognition.lang = toSpeechLang(lang); recognition.continuous = true; recognition.interimResults = true
    finalRef.current = currentTranscript
    stoppedByUserRef.current = false
    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      handleChange(finalRef.current + interim)
    }
    recognition.onerror = (e: any) => {
      // 'no-speech' et 'aborted' sont des arrets benins : onend suit et redemarre.
      if (e?.error === 'no-speech' || e?.error === 'aborted') return
      stoppedByUserRef.current = true
      setRecording(false)
      setRecError(e?.error === 'not-allowed' ? 'Accès au micro refusé.' : 'Erreur microphone.')
    }
    recognition.onend = () => {
      if (stoppedByUserRef.current) { setRecording(false); return }
      try { recognition.start() } catch { setRecording(false) }
    }
    recognitionRef.current = recognition
    recognition.start(); setRecording(true); setRecError('')
  }

  function stop() {
    stoppedByUserRef.current = true
    recognitionRef.current?.stop()
    setRecording(false)
  }

  // Demontage pendant une dictee : couper sans redemarrer.
  useEffect(() => () => { stoppedByUserRef.current = true; recognitionRef.current?.stop() }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={recording ? stop : start}
          aria-label={recording ? "Arrêter l'enregistrement" : 'Démarrer la dictée vocale'}
          aria-pressed={recording}
          className={cn('flex h-12 w-12 items-center justify-center rounded-full transition-[background-color,border-color,color,box-shadow,transform,opacity]', recording ? 'bg-error text-white animate-pulse' : 'bg-brand text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg')}>
          {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <span className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          {recording ? 'Enregistrement en cours...' : currentTranscript ? 'Clique pour continuer ou modifie le texte' : 'Clique pour dicter ton cours'}
        </span>
      </div>
      {recError && <p className="font-body text-[13px] text-error">{recError}</p>}
      {error && <p className="font-body text-[13px] text-error">{error}</p>}
      {currentTranscript && !recording && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
              Transcription — tu peux la modifier
            </label>
            <button type="button" onClick={() => handleChange('')}
              className="flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-error transition-colors">
              <X className="h-3.5 w-3.5" /> Effacer
            </button>
          </div>
          <textarea
            value={currentTranscript}
            onChange={(e) => handleChange(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-input border border-sky-border bg-sky-surface px-4 py-3 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface dark:text-text-dark-main dark:focus:border-brand-dark"
          />
        </div>
      )}
      {recording && currentTranscript && (
        <div className="rounded-input border border-brand/30 bg-brand-soft p-4 dark:border-brand-dark/30 dark:bg-brand-dark-soft max-h-48 overflow-y-auto">
          <p className="font-body text-[14px] text-text-main dark:text-text-dark-main whitespace-pre-wrap">{currentTranscript}</p>
        </div>
      )}
    </div>
  )
}
