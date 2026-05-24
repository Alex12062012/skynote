'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CoinReward } from '@/components/ui/CoinReward'

interface RewardData {
  amount: number
  reason: string
  icon?: string
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
  // Garde un flag pour bloquer les declenchements en rafale (double-click, StrictMode, etc.)
  const isShowingRef = useRef(false)

  const showReward = useCallback((data: RewardData) => {
    // Si une animation est deja en cours -> ignorer, jamais de double-play
    if (isShowingRef.current) return
    isShowingRef.current = true
    setReward(data)
    setVisible(true)
  }, [])

  // Stable via useCallback -> ne change jamais de reference -> pas de re-declenchement du useEffect de CoinReward
  const handleDone = useCallback(() => {
    setVisible(false)
    isShowingRef.current = false
    setTimeout(() => setReward(null), 400)
  }, [])

  return (
    <CoinRewardContext.Provider value={{ showReward }}>
      {children}
      {reward && (
        <CoinReward
          amount={reward.amount}
          reason={reward.reason}
          icon={reward.icon ? <span>{reward.icon}</span> : undefined}
          visible={visible}
          onDone={handleDone}
        />
      )}
    </CoinRewardContext.Provider>
  )
}
