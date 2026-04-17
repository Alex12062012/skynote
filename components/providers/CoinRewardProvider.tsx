'use client'

import { createContext, useContext, useState, useCallback } from 'react'
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

  const showReward = useCallback((data: RewardData) => {
    setReward(data)
    setVisible(true)
  }, [])

  function handleDone() {
    setVisible(false)
    setTimeout(() => setReward(null), 400)
  }

  return (
    <CoinRewardContext.Provider value={{ showReward }}>
      {children}
      {reward && (
        <CoinReward
          visible={visible}
          amount={reward.amount}
          reason={reward.reason}
          icon={reward.icon}
          onDone={handleDone}
        />
      )}
    </CoinRewardContext.Provider>
  )
}
