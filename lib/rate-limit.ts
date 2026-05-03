import { NextResponse } from 'next/server'

// In-memory sliding window per serverless instance.
// Provides basic protection; resets on cold start.
// For cross-instance rate limiting, replace with Upstash Redis.

interface Window { count: number; resetAt: number }
const store = new Map<string, Window>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessaie dans un moment.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  )
}
