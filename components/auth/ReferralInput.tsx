'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { SkyCoin } from '@/components/ui/SkyCoin'

interface ReferralInputProps {
  value: string
  onChange: (v: string) => void
}

export function ReferralInput({ value, onChange }: ReferralInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div>
      {!show ? (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="font-body text-[13px] text-brand hover:underline dark:text-brand-dark"
        >
          + J'ai un code de parrainage
        </button>
      ) : (
        <div className="space-y-1">
          <Input
            id="referral"
            label="Code de parrainage (optionnel)"
            placeholder="SKY-XXXXXX"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            maxLength={10}
          />
          <div className="flex items-center gap-1.5">
            <SkyCoin size={14} />
            <p className="font-body text-[12px] text-brand dark:text-brand-dark">
              +15 Sky Coins offerts à toi et ton ami !
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
