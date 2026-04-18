'use client'

import { useState, useTransition } from 'react'
import { Copy, Check, Users, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { generateReferralCode } from '@/lib/supabase/referral-actions'

interface ReferralCardProps {
  userId: string
  initialCode: string | null
  referralsCount: number
}

export function ReferralCard({ userId, initialCode, referralsCount }: ReferralCardProps) {
  const [code, setCode] = useState<string | null>(initialCode)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const newCode = await generateReferralCode(userId)
      setCode(newCode)
    })
  }

  function handleCopy() {
    if (!code) return
    const message = `Rejoins-moi sur Skynote !\nL'IA transforme tes cours en fiches de révision.\nUtilise mon code ${code} à l'inscription pour gagner +15 Sky Coins.\nhttps://skynote.app`
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="rounded-card border border-sky-border bg-sky-surface p-5 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="h-5 w-5 text-brand dark:text-brand-dark" />
            <h3 className="font-display text-h4 text-text-main dark:text-text-dark-main">
              Parraine un ami
            </h3>
          </div>
          <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
            Toi et ton ami recevez chacun{' '}
            <span className="font-semibold text-brand dark:text-brand-dark">+15 Sky Coins</span>
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <SkyCoin size={18} />
          <span className="font-body text-[14px] font-bold text-brand dark:text-brand-dark">+15</span>
        </div>
      </div>

      {/* Code */}
      {code ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-input border border-sky-border bg-sky-surface-2 px-4 py-3 dark:border-night-border dark:bg-night-surface-2">
              <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary mb-0.5">
                Ton code
              </p>
              <p className="font-display text-[20px] font-bold tracking-widest text-brand dark:text-brand-dark">
                {code}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-input border border-sky-border bg-sky-surface transition-all hover:border-brand/40 hover:bg-brand-soft dark:border-night-border dark:bg-night-surface dark:hover:border-brand-dark/40 dark:hover:bg-brand-dark-soft"
              title="Copier le message"
            >
              {copied
                ? <Check className="h-5 w-5 text-success dark:text-success-dark" />
                : <Copy className="h-5 w-5 text-text-secondary dark:text-text-dark-secondary" />
              }
            </button>
          </div>

          {copied && (
            <p className="flex items-center gap-1 font-body text-[12px] text-success dark:text-success-dark animate-slide-in">
              <Check className="h-3.5 w-3.5" /> Message copié ! Envoie-le à un ami.
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 rounded-input bg-sky-surface-2 px-4 py-2.5 dark:bg-night-surface-2">
            <Users className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary" />
            <span className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              <strong className="text-text-main dark:text-text-dark-main">{referralsCount}</strong> ami{referralsCount > 1 ? 's' : ''} parrainé{referralsCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      ) : (
        <Button onClick={handleGenerate} loading={isPending} className="w-full gap-2">
          Générer mon code
        </Button>
      )}
    </div>
  )
}
