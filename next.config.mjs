import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://upload.wikimedia.org",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://*.sentry.io https://o*.ingest.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  // `microphone=(self)` et non `microphone=()` : la liste vide bloque TOUT LE
  // MONDE, y compris skynote.fr, pas seulement les iframes tierces. Elle
  // cassait la dictee vocale (VoiceRecorder.tsx, API SpeechRecognition) sur
  // tous les navigateurs — verifie dans un vrai Chrome le 2026-09-26 :
  // allowsFeature('microphone') = false, permission micro forcee a « denied »
  // malgre une autorisation accordee d'office, et SpeechRecognition renvoyait
  // `not-allowed` des le start(). `(self)` autorise notre origine et continue
  // de refuser toute origine tierce embarquee.
  //
  // camera et geolocation restent fermes : rien ne les utilise. L'import de
  // photo passe par <input type="file" accept="image/*"> SANS attribut
  // `capture`, donc par le selecteur de fichiers du systeme — aucune
  // permission camera requise. La lecture a voix haute utilise
  // speechSynthesis, qui est une sortie audio et ne demande pas le micro.
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(self), geolocation=()' },
]

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  silent:                 !process.env.CI,
  widenClientFileUpload:  true,
  hideSourceMaps:         true,
  disableLogger:          true,
  automaticVercelMonitors: true,
})
