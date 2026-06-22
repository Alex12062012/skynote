'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { translate } from './translations'

interface I18nContextType {
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  t: (key) => translate(key),
})

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ t: translate }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
