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

export function I18nProvider({ children, initialLocale = 'fr' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    // Si aucun cookie n'est encore posé (anciens utilisateurs / 1ère visite)
    // mais qu'une préférence existe en localStorage, on l'applique et on
    // synchronise le cookie pour que le rendu serveur soit cohérent ensuite.
    const hasCookie = document.cookie.split('; ').some((c) => c.startsWith('skynote_locale='))
    if (!hasCookie) {
      const saved = localStorage.getItem('skynote_locale') as Locale | null
      if (saved && ['fr', 'en', 'ru', 'zh'].includes(saved) && saved !== initialLocale) {
        setLocaleState(saved)
        document.cookie = `skynote_locale=${saved};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
      }
    }
  }, [initialLocale])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('skynote_locale', l)
    // Synchroniser le cookie pour les Server Components
    document.cookie = `skynote_locale=${l};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
    // Recharger pour que les Server Components captent le changement
    window.location.reload()
  }

  const tFn = (key: string) => translate(locale, key)

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: tFn }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
