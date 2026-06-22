import { translate, type Locale } from './translations'

export async function getServerLocale(): Promise<Locale> {
  return 'fr'
}

export async function serverTranslate(key: string): Promise<string> {
  return translate(key)
}

export function createServerT(_locale?: Locale) {
  return (key: string) => translate(key)
}
