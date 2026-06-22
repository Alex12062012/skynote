import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { I18nProvider } from '@/lib/i18n/context'
import { getServerLocale } from '@/lib/i18n/server'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'], variable: '--font-bricolage', display: 'swap', weight: ['400','500','600','700']
})
const dmSans = DM_Sans({
  subsets: ['latin'], variable: '--font-dm-sans', display: 'swap', weight: ['400','500','600','700']
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://skynote.app'
const OG_TITLE = 'Skynote — Révise plus vite, Réussis mieux'
const OG_DESC  = "Transforme tes cours en fiches de révision et QCM grâce à l'IA. Gamification, répétition espacée et suivi de progression."

export const metadata: Metadata = {
  title: { default: OG_TITLE, template: '%s | Skynote' },
  description: OG_DESC,
  metadataBase: new URL(APP_URL),
  openGraph: {
    type:        'website',
    siteName:    'Skynote',
    title:       OG_TITLE,
    description: OG_DESC,
    url:         APP_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Skynote' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       OG_TITLE,
    description: OG_DESC,
    images:      ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EFF6FF' },
    { media: '(prefers-color-scheme: dark)', color: '#060D1A' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale()
  return (
    <html lang={locale} className={`${bricolage.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider><I18nProvider initialLocale={locale}>{children}</I18nProvider></ThemeProvider>
      </body>
    </html>
  )
}
