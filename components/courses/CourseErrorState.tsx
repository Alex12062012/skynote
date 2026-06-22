import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getNovaBalance, NOVA_COST_COURSE } from '@/lib/supabase/nova-actions'
import { RetryGenerationButton } from '@/components/courses/RetryGenerationButton'

/**
 * Etat d'erreur d'un cours. On vérifie le solde de Novas actuel pour distinguer
 * la vraie cause la plus fréquente (plus assez de Novas) d'un échec IA générique —
 * avant, le message blâmait systématiquement "le contenu est trop court", ce qui
 * était faux dans la majorité des cas et n'aidait pas l'utilisateur à se débloquer.
 */
export async function CourseErrorState({ courseId, userId }: { courseId: string; userId: string }) {
  const novaBalance = await getNovaBalance(userId)
  const insufficientNovas = novaBalance < NOVA_COST_COURSE

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-error/20 bg-error/5 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-error" />
      <div>
        <h2 className="font-display text-h4 text-text-main dark:text-text-dark-main">
          {insufficientNovas ? 'Plus assez de Novas ✦' : 'Erreur de génération'}
        </h2>
        <p className="mt-1 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          {insufficientNovas
            ? `Il te faut ${NOVA_COST_COURSE} ✦ pour générer ce cours, et tu n'en as que ${novaBalance}. Attends ton renouvellement mensuel ou passe à un plan supérieur.`
            : "L'IA n'a pas pu générer les fiches. Vérifie que le contenu de ton cours est suffisamment long."}
        </p>
      </div>
      {insufficientNovas ? (
        <Link href="/pricing" className="font-body text-[14px] font-semibold text-brand hover:underline dark:text-brand-dark">
          Voir les plans →
        </Link>
      ) : (
        <RetryGenerationButton courseId={courseId} />
      )}
    </div>
  )
}
