import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const isPremium = profile?.plan === 'plus' || profile?.plan === 'famille'

    const { data: beta } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'beta_mode')
      .single()
    const betaActive = beta?.value === 'true'

    if (!isPremium && !betaActive) {
      return NextResponse.json({ error: 'Chatbot reserve aux abonnes Plus et Famille' }, { status: 403 })
    }

    const { courseId, question, history } = await request.json()

    if (!courseId || !question) {
      return NextResponse.json({ error: 'Parametres manquants' }, { status: 400 })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('title, subject, source_content')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })

    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('title, summary, key_points')
      .eq('course_id', courseId)
      .order('order_index')

    const fichesContext = (flashcards || [])
      .map((f, i) => 'Fiche ' + (i + 1) + ' - ' + f.title + ':\n' + f.summary + '\nPoints cles: ' + (f.key_points as string[]).join(', '))
      .join('\n\n')

    const courseContent = (course.source_content || '').slice(0, 4000)

    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }
    messages.push({ role: 'user', content: question })

    const systemPrompt = [
      'Tu es un assistant pedagogique pour un eleve de college/lycee.',
      'Tu reponds aux questions sur ce cours. Utilise le contenu du cours en priorite, et tes connaissances generales en complement si besoin.',
      '',
      'COURS : ' + course.title + ' (' + course.subject + ')',
      '---',
      courseContent,
      '---',
      '',
      'FICHES DE REVISION :',
      fichesContext,
      '---',
      '',
      'REGLES :',
      '- Reponds en francais, de facon claire et adaptee a un eleve de 10-17 ans.',
      '- Sois concis (3-5 phrases max sauf si la question demande plus).',
      '- Si la question n a rien a voir avec le cours, reponds quand meme mais precise que ce n est pas dans le cours.',
      '- Utilise des exemples concrets quand possible.',
      '- Ne dis jamais "selon le cours" ou "d apres le document", reponds naturellement.',
      '- N utilise JAMAIS de formatage markdown. Pas de double etoile, pas d etoile, pas de diese, pas de backtick. Ecris en texte brut uniquement.',
      '- N utilise pas de listes a puces ni de tirets en debut de ligne.',
      '- Ecris en phrases fluides et naturelles, pas en listes numerotees.',
    ].join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages,
    })

    const answer = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ answer })
  } catch (error: any) {
    console.error('[API /chat]', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
