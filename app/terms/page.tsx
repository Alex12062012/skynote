import Link from 'next/link'
import { ArrowLeft, X } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Conditions d\'utilisation — Skynote' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-2">
          Conditions Générales d'Utilisation
        </h1>
        <p className="font-body text-[14px] text-text-tertiary dark:text-text-dark-tertiary mb-10">
          Dernière mise à jour : mars 2026
        </p>

        <div className="space-y-8 font-body text-[15px] text-text-main dark:text-text-dark-main leading-relaxed">

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">1. Présentation</h2>
            <p>Skynote est une application éducative en ligne permettant aux élèves de transformer leurs cours en fiches de révision et QCM grâce à l'intelligence artificielle. En utilisant Skynote, tu acceptes les présentes conditions d'utilisation.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">2. Accès au service</h2>
            <p>Skynote est accessible gratuitement en version de base. L'accès nécessite la création d'un compte avec une adresse email valide. En t'inscrivant, tu confirmes :</p>
            <ul className="mt-2 space-y-1 pl-4">
              {[
                'Avoir 15 ans ou plus, ou disposer de l\'autorisation d\'un représentant légal',
                'Fournir des informations exactes lors de la création du compte',
                'Être responsable de la confidentialité de tes identifiants',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-brand dark:text-brand-dark mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">3. Utilisation acceptable</h2>
            <p>Tu t'engages à utiliser Skynote de manière légale et respectueuse. Il est interdit de :</p>
            <ul className="mt-2 space-y-1 pl-4">
              {[
                'Importer du contenu illégal, offensant ou protégé par des droits d\'auteur sans autorisation',
                'Tenter de contourner les mesures de sécurité',
                'Utiliser l\'application à des fins commerciales sans accord préalable',
                'Partager ton compte avec d\'autres personnes',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 text-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">4. Sky Coins</h2>
            <p>Les Sky Coins sont une monnaie virtuelle interne à Skynote. Ils n'ont aucune valeur monétaire réelle et ne peuvent pas être échangés contre de l'argent. Skynote se réserve le droit de modifier le système de Sky Coins à tout moment.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">5. Contenu généré par l'IA</h2>
            <p>Les fiches de révision et QCM sont générés automatiquement par intelligence artificielle. Bien que nous fassions tout pour assurer leur qualité, Skynote ne garantit pas l'exactitude absolue du contenu généré. Il est recommandé de vérifier les informations importantes avec tes professeurs ou manuels scolaires.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">6. Version bêta</h2>
            <p>Skynote est actuellement en phase de bêta test. Le service peut contenir des bugs ou être temporairement indisponible. Skynote ne peut être tenu responsable des pertes de données ou interruptions de service durant cette phase.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">7. Propriété intellectuelle</h2>
            <p>L'application Skynote, son design, son code et ses fonctionnalités sont la propriété exclusive de leurs créateurs. Le contenu que tu importes (tes cours) reste ta propriété. Tu accordes à Skynote une licence limitée pour traiter ce contenu via l'IA afin de générer tes fiches.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">8. Suppression de compte</h2>
            <p>Tu peux supprimer ton compte à tout moment depuis la page Profil. La suppression entraîne l'effacement définitif de toutes tes données dans un délai de 30 jours.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">9. Modification des CGU</h2>
            <p>Skynote se réserve le droit de modifier ces CGU. En cas de modification importante, tu seras informé par email. La poursuite de l'utilisation de l'application vaut acceptation des nouvelles conditions.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">10. Contact</h2>
            <p>Pour toute question : <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></p>
          </section>

        </div>

        <div className="mt-12 border-t border-sky-border dark:border-night-border pt-6 flex gap-4">
          <Link href="/mentions-legales" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">Mentions legales</Link>`n          <Link href="/privacy" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Politique de confidentialité →
          </Link>
          <Link href="/dashboard" className="font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary">
            Retour à l'app
          </Link>
        </div>
      </div>
    </div>
  )
}
