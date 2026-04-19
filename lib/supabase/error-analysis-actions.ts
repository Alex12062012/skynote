'use server'

import { createClient } from './server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const FREE_DAILY_LIMIT = 5

// ============================================================
// TYPES
// ============================================================

export type ErrorAnalysis = {
  error: string
  explanation: string
  rule: string
  example: string
}

export type TriggerResult =
  | { status: 'ok'; analysis: ErrorAnalysis }
  | { status: 'quota_exceeded' }
  | { status: 'skipped' }      // pas assez d'erreurs ou cooldown
  | { status: 'error' }

// ============================================================
// triggerErrorAnalysis
// ============================================================

export async function triggerErrorAnalysis(flashcardId: string): Promise<TriggerResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 'error' }

    // 1. Récupérer la flashcard
    const { data: card } = await supabase
      .from('flashcards')
      .select('id, title, summary, consecutive_errors, last_ai_analysis_at, course_id')
      .eq('id', flashcardId)
      .eq('user_id', user.id)
      .single()

    if (!card) return { status: 'error' }

    // Incrémenter consecutive_errors
    const newErrors = (card.consecutive_errors ?? 0) + 1
    await supabase
      .from('flashcards')
      .update({ consecutive_errors: newErrors, last_error_at: new Date().toISOString() })
      .eq('id', flashcardId)

    // 2. Vérifier seuil (2 erreurs consécutives)
    if (newErrors < 2) return { status: 'skipped' }

    // 3. Cooldown 24h
    if (card.last_ai_analysis_at) {
      const last = new Date(card.last_ai_analysis_at)
      const diffH = (Date.now() - last.getTime()) / 3600000
      if (diffH < 24) return { status: 'skipped' }
    }

    // 4. Vérifier plan + quota
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const isPremium = profile?.plan === 'plus' || profile?.plan === 'famille'

    if (!isPremium) {
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single()

      if ((usage?.count ?? 0) >= FREE_DAILY_LIMIT) {
        return { status: 'quota_exceeded' }
      }
    }

    // 5. Appel Anthropic
    const prompt = `You are an expert tutor helping a student understand their mistake.

CONTEXT:
- Question: ${card.title}
- Correct answer: ${card.summary}
- User failed this question twice.

TASK:
Analyze the likely misunderstanding and generate a clear explanation.

OUTPUT FORMAT (STRICT JSON):
{
  "error": "what the student likely misunderstood (1 sentence)",
  "explanation": "simple intuitive explanation (2-3 sentences)",
  "rule": "key rule to remember (1 sentence)",
  "example": "one concrete example"
}

IMPORTANT: JSON only, no markdown, maximum 120 words total.`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    const parsed = parseAnalysisJSON(raw)
    if (!parsed) return { status: 'error' }

    // 6. Incrémenter quota
    if (!isPremium) {
      const today = new Date().toISOString().split('T')[0]
      await supabase.rpc('increment_ai_usage', { p_user_id: user.id, p_date: today })
        .catch(() =>
          supabase.from('ai_usage').upsert(
            { user_id: user.id, usage_date: today, count: 1 },
            { onConflict: 'user_id,usage_date' }
          )
        )
    }

    // 7. Créer flashcard simplifiée IA
    const simplifiedTitle = `[Rappel] ${card.title}`
    const simplifiedSummary = `${parsed.rule}\n\nExemple : ${parsed.example}`

    const { data: newCard } = await supabase
      .from('flashcards')
      .insert({
        user_id: user.id,
        course_id: card.course_id,
        title: simplifiedTitle,
        summary: simplifiedSummary,
        source_type: 'ai_generated',
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0,
      })
      .select('id')
      .single()

    // 8. Insérer dans error_analyses
    const explanationJSON = JSON.stringify(parsed)
    await supabase.from('error_analyses').insert({
      user_id: user.id,
      flashcard_id: flashcardId,
      error_count: newErrors,
      ai_explanation: explanationJSON,
      generated_flashcard_id: newCard?.id ?? null,
    })

    // 9. Mettre à jour last_ai_analysis_at + reset consecutive_errors
    await supabase
      .from('flashcards')
      .update({ last_ai_analysis_at: new Date().toISOString(), consecutive_errors: 0 })
      .eq('id', flashcardId)

    return { status: 'ok', analysis: parsed }
  } catch {
    return { status: 'error' }
  }
}

// ============================================================
// Parse JSON avec fallback regex
// ============================================================

function parseAnalysisJSON(raw: string): ErrorAnalysis | null {
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    return JSON.parse(cleaned) as ErrorAnalysis
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as ErrorAnalysis } catch { return null }
    }
    return null
  }
}
