import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

// Client anon — les flashcards publiques doivent avoir une RLS SELECT permissive (ou on utilise service role)
function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = getPublicClient()
  const { data } = await supabase
    .from('flashcards')
    .select('title, summary')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Fiche de révision — Skynote' }

  return {
    title: `${data.title} — Fiche de révision Skynote`,
    description: data.summary.slice(0, 160),
    openGraph: {
      title: `${data.title} — Fiche de révision`,
      description: data.summary.slice(0, 160),
      siteName: 'Skynote',
    },
  }
}

export default async function FichePage({ params }: Props) {
  const { id } = await params
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) notFound()

  const supabase = getPublicClient()
  const { data: fiche } = await supabase
    .from('flashcards')
    .select('id, title, summary, key_points, course_id')
    .eq('id', id)
    .single()

  if (!fiche) notFound()

  const { data: course } = await supabase
    .from('courses')
    .select('title, subject')
    .eq('id', fiche.course_id)
    .single()

  const keyPoints: string[] = Array.isArray(fiche.key_points)
    ? fiche.key_points
    : (() => { try { return JSON.parse(String(fiche.key_points || '[]')) } catch { return [] } })()

  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg">
      {/* Header minimal */}
      <header className="border-b border-sky-border bg-sky-surface/80 backdrop-blur-lg dark:border-night-border dark:bg-night-surface/80">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
            Skynote
          </Link>
          <Link href="/signup"
            className="flex items-center gap-1.5 rounded-input bg-brand px-3.5 py-1.5 font-body text-[13px] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-brand-dark dark:text-night-bg">
            Créer un compte gratuit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* Fil d'ariane matière */}
        {course && (
          <p className="mb-3 font-body text-[12px] uppercase tracking-wide text-text-tertiary dark:text-text-dark-tertiary">
            {course.subject} · {course.title}
          </p>
        )}

        {/* Titre */}
        <h1 className="font-display text-[26px] font-bold leading-tight text-text-main dark:text-text-dark-main sm:text-[30px]">
          {fiche.title}
        </h1>

        {/* Résumé */}
        <p className="mt-4 font-body text-[15px] leading-relaxed text-text-secondary dark:text-text-dark-secondary">
          {fiche.summary}
        </p>

        {/* Points essentiels */}
        {keyPoints.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 font-body text-label-caps text-text-tertiary dark:text-text-dark-tertiary">
              Points essentiels
            </h2>
            <ul className="space-y-3">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft font-body text-[11px] font-bold text-brand dark:bg-brand-dark-soft dark:text-brand-dark">
                    {i + 1}
                  </span>
                  <span className="font-body text-[14px] leading-relaxed text-text-main dark:text-text-dark-main">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-card border border-brand/20 bg-brand-soft p-6 text-center dark:border-brand-dark/20 dark:bg-brand-dark-soft">
          <p className="font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
            Crée tes propres fiches gratuitement
          </p>
          <p className="mt-1.5 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Importe n'importe quel cours — l'IA génère les fiches et QCM en 30 secondes.
          </p>
          <Link href="/signup"
            className="mt-5 inline-flex items-center gap-2 rounded-input bg-brand px-5 py-2.5 font-body text-[15px] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-brand-dark dark:text-night-bg">
            Essayer Skynote — c'est gratuit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
