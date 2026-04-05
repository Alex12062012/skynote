'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Locale, translate } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('skynote_locale') as Locale | null
    if (saved && ['fr', 'en', 'ru', 'zh'].includes(saved)) {
      setLocaleState(saved)
    }
    setMounted(true)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('skynote_locale', l)
    // Synchroniser le cookie pour les Server Components
    document.cookie = `skynote_locale=${l};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
    // Recharger pour que les Server Components captent le changement
    window.location.reload()
  }

  const tFn = (key: string) => translate(locale, key)

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: tFn }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
