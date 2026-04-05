import { cookies } from 'next/headers'
import { translate, type Locale } from './translations'

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const saved = cookieStore.get('skynote_locale')?.value as Locale | undefined
  if (saved && ['fr', 'en', 'ru', 'zh'].includes(saved)) return saved
  return 'fr'
}

export async function serverTranslate(key: string): Promise<string> {
  const locale = await getServerLocale()
  return translate(locale, key)
}

export function createServerT(locale: Locale) {
  return (key: string) => translate(locale, key)
}
