'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CoinReward } from '@/components/ui/CoinReward'

interface RewardData {
  amount: number
  reason: string
  icon?: string
  variant?: 'normal' | 'prestige'
}

interface CoinRewardContextType {
  showReward: (data: RewardData) => void
}

const CoinRewardContext = createContext<CoinRewardContextType>({ showReward: () => {} })

export function useCoinReward() {
  return useContext(CoinRewardContext)
}

export function CoinRewardProvider({ children }: { children: React.ReactNode }) {
  const [reward, setReward] = useState<RewardData | null>(null)
  const [visible, setVisible] = useState(false)
  const isShowingRef = useRef(false)
  // File d'attente : si une animation est en cours, on empile la suivante
  const queueRef = useRef<RewardData[]>([])

  const playNext = useCallback((data: RewardData) => {
    isShowingRef.current = true
    setReward(data)
    setVisible(true)
  }, [])

  const showReward = useCallback((data: RewardData) => {
    if (isShowingRef.current) {
      // Empiler — sera joué après la fin de l'animation courante
      queueRef.current.push(data)
      return
    }
    playNext(data)
  }, [playNext])

  const handleDone = useCallback(() => {
    setVisible(false)
    isShowingRef.current = false
    setTimeout(() => {
      setReward(null)
      // Dépiler et jouer le suivant après un court silence
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!
        setTimeout(() => playNext(next), 250)
      }
    }, 400)
  }, [playNext])

  return (
    <CoinRewardContext.Provider value={{ showReward }}>
      {children}
      {reward && (
        <CoinReward
          amount={reward.amount}
          reason={reward.reason}
          icon={reward.icon ? <span>{reward.icon}</span> : undefined}
          variant={reward.variant}
          visible={visible}
          onDone={handleDone}
        />
      )}
    </CoinRewardContext.Provider>
  )
}
