import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function CourseNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="text-5xl">🔍</span>
      <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main">Cours introuvable</h1>
      <p className="font-body text-[15px] text-text-secondary dark:text-text-dark-secondary">Ce cours n'existe pas ou n'appartient pas à ton compte.</p>
      <Link href="/courses"><Button variant="secondary">← Retour à mes cours</Button></Link>
    </div>
  )
}
