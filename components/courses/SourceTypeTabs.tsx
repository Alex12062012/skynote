'use client'

import { FileText, File, Camera, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

const ALL_TABS = [
  { id: 'text',  label: 'Texte', Icon: FileText, premiumOnly: false },
  { id: 'pdf',   label: 'PDF',   Icon: File,     premiumOnly: false },
  { id: 'photo', label: 'Photo', Icon: Camera,   premiumOnly: false },
  { id: 'vocal', label: 'Vocal', Icon: Mic,      premiumOnly: true  },
] as const

type SourceType = 'text' | 'pdf' | 'photo' | 'vocal'

interface SourceTypeTabsProps {
  value: SourceType
  onChange: (v: SourceType) => void
  vocalEnabled?: boolean
}

export function SourceTypeTabs({ value, onChange, vocalEnabled = true }: SourceTypeTabsProps) {