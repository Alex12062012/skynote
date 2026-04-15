'use client'

import { useState, useRef } from 'react'
import { Mic, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onTranscript?: (t: string) => void
  onChange?: (t: string) => void
  transcript?: string
  value?: string
  error?: string
}

export function VoiceRecorder({ onTranscript, onChange, transcript, value, error }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [recError, setRecError] = useState('')
  const recognitionRef = useRef<any>(null)
  const finalRef = useRef('')

  const currentTranscript = transcript ?? value ?? ''
  const handleChange = onTranscript ?? onChange ?? (() => {})

  function start() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecError("La reconnaissance vocale n'est pas supportée par ce navigateur.")
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true
    finalRef.current = currentTranscript

    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      handleChange(finalRef.current + interim)
    }
    recognition.onerror = () => {
      setRecording(false)
      setRecError('Erreur microphone. Vérifie que tu as autorisé l\'accès.')
    }
    recognition.onend = () => setRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
    setRecError('')
  }

  function stop() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={recording ? stop : start}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-all flex-shrink-0',
            recording
              ? 'bg-error text-white animate-pulse'
              : 'bg-brand text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg'
          )}
        >
          {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <span className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          {recording
            ? 'Enregistrement en cours...'
            : currentTranscript
            ? 'Clique pour continuer ou modifie le texte'
            : 'Clique pour dicter ton cours'}
        </span>
      </div>

      {recError && (
        <p className="font-body text-[13px] text-error">{recError}</p>
      )}
      {error && (
        <p className="font-body text-[13px] text-error">{error}</p>
      )}

      {currentTranscript && !recording && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">
              Transcription — tu peux la modifier
            </label>
            <button
              type="button"
              onClick={() => handleChange('')}
              className="flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-error transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Effacer
            </button>
          </div>
          <textarea
            value={currentTranscript}
            onChange={(e) => handleChange(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-input border border-sky-border bg-sky-surface px-4 py-3 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-brand focus:outline-none dark:border-night-border dark:bg-night-surface 