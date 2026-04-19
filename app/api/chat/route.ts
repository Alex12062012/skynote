import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

type MessageType = 'text' | 'quiz_suggestion' | 'error_insight' | 'premium_prompt'

interface PersistedMessage {
  role: 'user' | 'assistant'
  content: string
  type: MessageType
  timestamp: string
}

// ============================================================
// GET — charger l'historique persisté
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ messages: [] })

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return NextResponse.json({ messages: [] })

    const { data } = await supabase
      .from('chat_sessions')
      .select('messages')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    return NextResponse.json({ messages: (data?.messages as PersistedMessage[]) ?? [] })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

// ============================================================
// POST — répondre + persister
// ============================================================

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

    // Free users → premium_prompt au lieu de 403
    if (!isPremium && !betaActive) {
      return NextResponse.json({
        answer: "Tu as des erreurs sur ce cours — passe premium pour que l'IA t'aide à les corriger.",
        type: 'premium_prompt' as MessageType,
      })
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

    // Charger historique persisté si le client n'en envoie pas
    let resolvedHistory: PersistedMessage[] = Array.isArray(history) && history.length > 0
      ? history
      : []

    if (resolvedHistory.length === 0) {
      try {
        const { data: session } = await supabase
          .from('chat_sessions')
          .select('messages')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single()
        if (session?.messages) {
          resolvedHistory = (session.messages as PersistedMessage[]).slice(-10)
        }
      } catch { /* pas d'historique, on continue */ }
    }

    // Flashcards du cours
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('id, title, summary, key_points, mastery_level, consecutive_errors')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .order('order_index')

    const fichesContext = (flashcards || [])
      .map((f, i) => `Fiche ${i + 1} - ${f.title}:\n${f.summary}\nPoints cles: ${(f.key_points as string[]).join(', ')}`)
      .join('\n\n')

    // Contexte SM-2 — optionnel, ne bloque jamais le chat
    let sm2Context = ''
    try {
      const allCards = flashcards || []
      const masteryAvg = allCards.length > 0
        ? Math.round((allCards.reduce((s, c) => s + (c.mastery_level ?? 0), 0) / allCards.length) * 20)
        : 0
      const hasBlocage = allCards.some(c => (c.consecutive_errors ?? 0) >= 2)

      const flashcardIds = allCards.map(c => c.id).filter(Boolean)
      let errorLines = 'Aucune'

      if (flashcardIds.length > 0) {
        const { data: errorAnalyses } = await supabase
          .from('error_analyses')
          .select('ai_explanation, error_count')
          .eq('user_id', user.id)
          .in('flashcard_id', flashcardIds)
          .order('error_count', { ascending: false })
          .limit(3)

        if (errorAnalyses && errorAnalyses.length > 0) {
          errorLines = errorAnalyses.map(e => {
            try {
              const parsed = JSON.parse(e.ai_explanation)
              return parsed.error ?? e.ai_explanation
            } catch { return e.ai_explanation }
          }).join(' | ')
        }
      }

      sm2Context = [
        '[CONTEXTE APPRENANT]',
        `- Niveau de maîtrise global : ${masteryAvg}%`,
        `- Blocages actuels : ${hasBlocage ? 'Oui - privilégier explications par étapes' : 'Non - aller à l\'essentiel'}`,
        `- Erreurs récurrentes : ${errorLines}`,
        '',
        'Si l\'élève semble bloqué, propose spontanément un mini-quiz ou une reformulation plus simple.',
        'Si l\'élève demande un quiz, génère 3 questions sous forme de message avec type quiz_suggestion.',
        '',
      ].join('\n')
    } catch { /* contexte SM-2 optionnel */ }

    const courseContent = (course.source_content || '').slice(0, 4000)

    const systemPrompt = [
      sm2Context,
      'Tu es un assistant pedagogique pour un eleve de college/lycee.',
      'Tu reponds aux questions sur ce cours. Utilise le contenu du cours en priorite, et tes connaissances generales en complement si besoin.',
      '',
      `COURS : ${course.title} (${course.subject})`,
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

    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    for (const msg of resolvedHistory.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content })
    }
    messages.push({ role: 'user', content: question })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages,
    })

    const answer = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    // Détecter le type
    const detectedType: MessageType =
      /Question 1|Q1\b/i.test(answer) ? 'quiz_suggestion'
      : /erreur|confond|confus|mal compris/i.test(answer) ? 'error_insight'
      : 'text'

    // Persister en fire & forget
    const now = new Date().toISOString()
    const updatedMessages: PersistedMessage[] = [
      ...resolvedHistory,
      { role: 'user', content: question, type: 'text', timestamp: now },
      { role: 'assistant', content: answer, type: detectedType, timestamp: now },
    ].slice(-10)

    supabase.from('chat_sessions').upsert(
      { user_id: user.id, course_id: courseId, messages: updatedMessages, updated_at: now },
      { onConflict: 'user_id,course_id' }
    ).catch(() => {})

    return NextResponse.json({ answer, type: detectedType })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
