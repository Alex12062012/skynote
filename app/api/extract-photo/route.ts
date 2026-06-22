import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { NOVA_COST_OCR, addNovasForUser } from '@/lib/supabase/nova-actions'
import { Errors, apiError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  let novaDeducted = false
  let userId: string | null = null

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw Errors.unauthorized()
    userId = user.id

    const rl = await checkRateLimit(user.id, 'extract-photo', RATE_LIMITS.extractPhoto)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite atteinte : 10 extractions photo par jour. Réessaie demain.' },
        { status: 429, headers: { 'X-RateLimit-Reset': String(rl.resetAt) } }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) throw Errors.badRequest('Fichier manquant')

    // Vérifier et déduire les Novas AVANT l'appel IA
    const { deductNovasForUser } = await import('@/lib/supabase/nova-actions')
    const deductResult = await deductNovasForUser(user.id, NOVA_COST_OCR, 'OCR photo')
    if (!deductResult.ok) {
      return NextResponse.json(
        { error: deductResult.error ?? 'Novas insuffisantes', code: 'insufficient_novas' },
        { status: 402 }
      )
    }
    novaDeducted = true

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    // OPTIMISATION: claude-haiku-4-5 au lieu de claude-sonnet-4-6
    // L'OCR est une tâche de transcription simple — Haiku le fait aussi bien.
    // Tarif Haiku : $1 input / $5 output vs $3 / $15 pour Sonnet → ~3× moins cher.
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Transcris exactement tout le texte visible sur cette image de cours scolaire.
              Préserve la structure (titres, listes, paragraphes).
              Si c'est manuscrit et difficile à lire, fais de ton mieux et indique [illisible] pour les parties incompréhensibles.
              Réponds UNIQUEMENT avec le texte transcrit, sans commentaire ni introduction.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ text, success: true, novaBalance: deductResult.balance })
  } catch (error: unknown) {
    if (novaDeducted && userId) {
      await addNovasForUser(userId, NOVA_COST_OCR, 'Remboursement OCR échoué').catch(() => {})
    }
    return apiError(error)
  }
}
