import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://skynote.app'
  const now  = new Date()
  return [
    { url: base,                changeFrequency: 'weekly',  priority: 1.0, lastModified: now },
    { url: `${base}/pricing`,   changeFrequency: 'monthly', priority: 0.9, lastModified: now },
    { url: `${base}/login`,     changeFrequency: 'yearly',  priority: 0.5, lastModified: now },
    { url: `${base}/signup`,    changeFrequency: 'yearly',  priority: 0.6, lastModified: now },
    { url: `${base}/famille`,   changeFrequency: 'monthly', priority: 0.7, lastModified: now },
  ]
}
