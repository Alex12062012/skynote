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
      return NextResponse.json({
        answer: "Tu as des erreurs sur ce cours — passe premium pour que l'IA t'aide a les corriger.",
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
      } catch { /* pas d'historique */ }
    }

    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('id, title, summary, key_points, mastery_level, consecutive_errors')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .order('order_index')

    const fichesContext = (flashcards || [])
      .map((f, i) => `Fiche ${i + 1} - ${f.title}:\n${f.summary}\nPoints cles: ${(f.key_points as string[]).join(', ')}`)
      .join('\n\n')

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
        `- Niveau de maitrise global : ${masteryAvg}%`,
        `- Blocages actuels : ${hasBlocage ? 'Oui - privilegier explications par etapes' : "Non - aller a l'essentiel"}`,
        `- Erreurs recurrentes : ${errorLines}`,
        '',
        "Si l'eleve semble bloque, propose spontanement un mini-quiz ou une reformulation plus simple.",
        "Si l'eleve demande un quiz, genere 3 questions sous forme de message avec type quiz_suggestion.",
        '',
      ].join('\n')
    } catch { /* contexte SM-2 optionnel */ }

    // OPTIMISATION: on réduit le contenu du cours à 2000 chars (était 4000).
    // Le reste est couvert par les fiches, qui sont plus structurées.
    const courseContent = (course.source_content || '').slice(0, 2000)

    // OPTIMISATION: Prompt Caching Anthropic
    // Les blocs avec cache_control sont mis en cache côté serveur Anthropic.
    // Coût d'un cache hit = 10% du prix normal d'input → -70% sur le chat.
    // Le cache se renouvelle automatiquement toutes les 5 minutes (ou 1h avec TTL étendu).
    // On place les cache_control sur les blocs les plus stables et les plus lourds :
    //   1. Les instructions + règles (ne changent jamais)
    //   2. Le contenu du cours + les fiches (changent par cours, pas par message)
    // Le contexte SM-2 reste non-caché car il varie à chaque appel.
    const systemBlocks: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        // Bloc 1 : instructions statiques — caché indéfiniment tant que le cours ne change pas
        text: [
          "Tu es un assistant pedagogique pour un eleve de college/lycee.",
          "Tu reponds aux questions sur ce cours. Utilise le contenu du cours en priorite, et tes connaissances generales en complement si besoin.",
          '',
          'REGLES :',
          '- Reponds en francais, de facon claire et adaptee a un eleve de 10-17 ans.',
          '- Sois concis (3-5 phrases max sauf si la question demande plus).',
          "- Si la question n a rien a voir avec le cours, reponds quand meme mais precise que ce n est pas dans le cours.",
          '- Utilise des exemples concrets quand possible.',
          '- Ne dis jamais "selon le cours" ou "d apres le document", reponds naturellement.',
          '- N utilise JAMAIS de formatage markdown. Pas de double etoile, pas d etoile, pas de diese, pas de backtick. Ecris en texte brut uniquement.',
          '- N utilise pas de listes a puces ni de tirets en debut de ligne.',
          '- Ecris en phrases fluides et naturelles, pas en listes numerotees.',
        ].join('\n'),
        // @ts-ignore — cache_control est supporté par l'API mais pas encore typé dans certaines versions du SDK
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        // Bloc 2 : contenu du cours + fiches — caché par session de cours
        // Ce bloc change quand l'utilisateur change de cours, mais est stable pendant toute la session.
        text: [
          `COURS : ${course.title} (${course.subject})`,
          '---',
          courseContent,
          '---',
          '',
          'FICHES DE REVISION :',
          fichesContext,
          '---',
        ].join('\n'),
        // @ts-ignore
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        // Bloc 3 : contexte SM-2 dynamique — non caché car change à chaque appel
        text: sm2Context || '[CONTEXTE APPRENANT]\n- Aucun historique de révision disponible.\n',
      },
    ]

    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    for (const msg of resolvedHistory.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content })
    }
    messages.push({ role: 'user', content: question })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemBlocks,
      messages,
    })

    const answer = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const detectedType: MessageType =
      /Question 1|Q1\b/i.test(answer) ? 'quiz_suggestion'
      : /erreur|confond|confus|mal compris/i.test(answer) ? 'error_insight'
      : 'text'

    const now = new Date().toISOString()
    const updatedMessages: PersistedMessage[] = [
      ...resolvedHistory,
      { role: 'user' as const, content: String(question), type: 'text' as MessageType, timestamp: now },
      { role: 'assistant' as const, content: answer, type: detectedType, timestamp: now },
    ].slice(-10)

    void (async () => { await supabase.from('chat_sessions').upsert(
      { user_id: user.id, course_id: courseId, messages: updatedMessages, updated_at: now },
      { onConflict: 'user_id,course_id' }
    ) })().catch(() => {})

    return NextResponse.json({ answer, type: detectedType })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
