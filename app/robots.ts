import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://skynote.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow:    ['/', '/pricing', '/login', '/signup', '/lexo'],
        disallow: ['/api/', '/dashboard/', '/admin/', '/courses/', '/boutique/', '/profile/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
