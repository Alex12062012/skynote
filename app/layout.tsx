import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { I18nProvider } from '@/lib/i18n/context'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'], variable: '--font-bricolage', display: 'swap', weight: ['400','500','600','700']
})
const dmSans = DM_Sans({
  subsets: ['latin'], variable: '--font-dm-sans', display: 'swap', weight: ['400','500','600','700']
})

export const metadata: Metadata = {
  title: { default: 'Skynote — Révise plus vite, Réussis mieux', template: '%s | Skynote' },
  description: "Transforme tes cours en fiches de révision et QCM grâce à l'IA.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://skynote.app'),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider><I18nProvider>{children}</I18nProvider></ThemeProvider>
      </body>
    </html>
  )
}
