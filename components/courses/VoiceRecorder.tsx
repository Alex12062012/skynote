'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps { onTranscript: (t: string) => void; transcript: string }

export function VoiceRecorder({ onTranscript, transcript }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  function start() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError("La reconnaissance vocale n'est pas supportée par ce navigateur."); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'; recognition.continuous = true; recognition.interimResults = true
    let finalTranscript = transcript
    recognition.onresult = (e: any) => {
      let interimTranscript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' '
        else interimTranscript += e.results[i][0].transcript
      }
      onTranscript(finalTranscript + interimTranscript)
    }
    recognition.onerror = () => { setRecording(false); setError('Erreur microphone.') }
    recognition.onend = () => setRecording(false)
    recognitionRef.current = recognition
    recognition.start(); setRecording(true); setError('')
  }

  function stop() { recognitionRef.current?.stop(); setRecording(false) }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={recording ? stop : start}
          className={cn('flex h-12 w-12 items-center justify-center rounded-full transition-all', recording ? 'bg-error text-white animate-pulse' : 'bg-brand text-white hover:bg-brand-hover dark:bg-brand-dark dark:text-night-bg')}>
          {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <span className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          {recording ? '🔴 Enregistrement en cours...' : transcript ? 'Clique pour continuer' : 'Clique pour dicter ton cours'}
        </span>
      </div>
      {error && <p className="font-body text-[13px] text-error">{error}</p>}
      {transcript && (
        <div className="rounded-input border border-sky-border bg-sky-surface-2 p-4 dark:border-night-border dark:bg-night-surface-2 max-h-48 overflow-y-auto">
          <p className="font-body text-[14px] text-text-main dark:text-text-dark-main whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </div>
  )
}
