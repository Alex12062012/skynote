import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verifier l'authentification
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    // Convertir en base64
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
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

    return NextResponse.json({ text, success: true })
  } catch (error: any) {
    console.error('[extract-photo]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
