import Link from 'next/link'
import { ArrowLeft, X, Check } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Conditions Générales d'Utilisation — Skynote" }

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
          Dernière mise à jour : avril 2026 — Version 1.2. Ces CGU constituent un contrat entre toi et Skynote.
        </p>

        <div className="space-y-8 font-body text-[15px] text-text-main dark:text-text-dark-main leading-relaxed">

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">1. Présentation du service</h2>
            <p><strong>Skynote</strong> est une application éducative en ligne permettant aux élèves de transformer leurs cours en fiches de révision et QCM grâce à l'intelligence artificielle. L'application est éditée par Alexandre Roudaut, micro-entrepreneur (ci-après « Skynote »).</p>
            <p className="mt-2">En créant un compte et en utilisant Skynote, tu acceptes sans réserve les présentes CGU. Si tu n'acceptes pas ces conditions, tu ne dois pas utiliser le service.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">2. Accès au service</h2>
            <p>Skynote est accessible gratuitement en version de base. L'accès nécessite la création d'un compte avec une adresse email valide. En t'inscrivant, tu confirmes :</p>
            <ul className="mt-3 space-y-2 pl-0 list-none">
              {[
                'Avoir 15 ans ou plus, ou disposer de l\'autorisation explicite d\'un représentant légal (parent ou tuteur)',
                'Avoir au moins 10 ans (âge minimum requis pour utiliser Skynote)',
                'Fournir des informations exactes, complètes et à jour lors de la création du compte',
                'Être l\'unique utilisateur de ton compte (pas de partage de compte)',
                'Être responsable de la confidentialité de tes accès',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand dark:text-brand-dark" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">3. Utilisation acceptable</h2>
            <p className="mb-3">Tu t'engages à utiliser Skynote de manière légale et respectueuse. Il est strictement interdit de :</p>
            <ul className="space-y-2 pl-0 list-none">
              {[
                'Importer du contenu illégal, offensant, haineux, ou protégé par des droits d\'auteur sans autorisation',
                'Tenter de contourner, compromettre ou altérer les mesures de sécurité de l\'application',
                'Utiliser Skynote à des fins commerciales, de revente ou de prestation de services sans accord préalable écrit',
                'Partager ton compte avec d\'autres personnes ou créer plusieurs comptes',
                'Utiliser des robots, scripts ou outils automatisés pour accéder au service',
                'Tenter de collecter des données d\'autres utilisateurs',
                'Usurper l\'identité d\'une autre personne',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-input border border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-3 text-[14px]">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Skynote se réserve le droit de suspendre ou supprimer tout compte en cas de violation de ces règles, sans préavis ni remboursement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">4. Offres et abonnements</h2>
            <p>Skynote propose plusieurs offres :</p>
            <div className="mt-3 space-y-2">
              {[
                ['Gratuit', 'Accès limité aux fonctionnalités de base. Quotas d\'utilisation appliqués.'],
                ['Skynote Plus', 'Abonnement mensuel ou annuel donnant accès à toutes les fonctionnalités sans restriction. Renouvellement automatique, résiliable à tout moment.'],
                ['Famille', 'Accès multi-comptes pour une famille. Mêmes conditions que Skynote Plus.'],
              ].map(([plan, desc]) => (
                <div key={plan} className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                  <p className="font-semibold">{plan}</p>
                  <p className="text-text-secondary dark:text-text-dark-secondary mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Les paiements sont traités par <strong>Stripe</strong>. Tu peux résilier ton abonnement à tout moment depuis les paramètres de ton compte. La résiliation prend effet à la fin de la période en cours — aucun remboursement au prorata n'est effectué sauf obligation légale. Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation de 14 jours s'applique, sauf si tu as expressément demandé l'accès immédiat au service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">5. Sky Coins et système de gamification</h2>
            <p>Les Sky Coins sont une monnaie virtuelle interne à Skynote :</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>Ils n'ont <strong>aucune valeur monétaire réelle</strong> et ne peuvent pas être échangés contre de l'argent</li>
              <li>Ils ne peuvent pas être transférés entre comptes</li>
              <li>Ils sont perdus en cas de suppression du compte</li>
              <li>Skynote se réserve le droit de modifier le système de Sky Coins, les récompenses et les coûts à tout moment</li>
              <li>Les éléments de personnalisation débloqués (skins, badges, titres) sont attachés au compte et non transférables</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">6. Contenu généré par l'IA</h2>
            <p>Les fiches de révision et QCM sont générés automatiquement par intelligence artificielle (Anthropic Claude). <strong>Important :</strong></p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>Skynote ne garantit pas l'exactitude, la complétude ou la pertinence du contenu généré</li>
              <li>Le contenu généré est fourni à titre d'aide pédagogique et ne remplace pas les manuels scolaires ni les professeurs</li>
              <li>Il est recommandé de vérifier les informations importantes avec tes enseignants</li>
              <li>Skynote décline toute responsabilité pour les erreurs contenues dans le contenu généré</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">7. Propriété intellectuelle</h2>
            <p><strong>Propriété de Skynote :</strong> L'application, son design, son code source, ses fonctionnalités, sa marque et ses logos sont la propriété exclusive d'Alexandre Roudaut et sont protégés par le droit d'auteur (Code de la propriété intellectuelle) et le droit des marques.</p>
            <p className="mt-3"><strong>Propriété de l'utilisateur :</strong> Le contenu que tu importes (tes cours, notes personnelles) reste ta propriété exclusive. En utilisant Skynote, tu accordes à Skynote une <strong>licence limitée, non exclusive, non transférable et révocable</strong> pour traiter ce contenu via l'IA aux seules fins de générer tes fiches et QCM.</p>
            <p className="mt-3 text-[13px] text-text-secondary dark:text-text-dark-secondary">Toute reproduction, représentation ou diffusion de l'application sans autorisation expresse constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">8. Disponibilité du service</h2>
            <p>Skynote s'efforce d'assurer la disponibilité du service 24h/24 et 7j/7, mais ne peut garantir une disponibilité sans interruption. Des maintenances programmées peuvent être nécessaires. Skynote ne peut être tenu responsable des interruptions de service liées à des tiers (hébergeur, opérateur réseau).</p>
            <p className="mt-2 text-[13px] text-text-secondary dark:text-text-dark-secondary">Skynote est actuellement en phase de développement actif (bêta). Des fonctionnalités peuvent évoluer, être ajoutées ou retirées. Les utilisateurs inscrits en bêta bénéficient d'un accès anticipé et acceptent ce contexte.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">9. Suppression de compte</h2>
            <p>Tu peux supprimer ton compte à tout moment depuis la page <strong>Profil → Supprimer mon compte</strong>. La suppression entraîne :</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>L'effacement définitif de toutes tes données personnelles dans un délai de 30 jours</li>
              <li>La perte de tous tes cours, fiches, Sky Coins, badges et progression</li>
              <li>La résiliation immédiate de tout abonnement actif (sans remboursement de la période en cours)</li>
            </ul>
            <p className="mt-2 text-[13px] text-text-secondary dark:text-text-dark-secondary">Cette action est irréversible. Un email de confirmation te sera envoyé.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">10. Responsabilité</h2>
            <p>Dans les limites permises par la loi française :</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>Skynote ne peut être tenu responsable des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service</li>
              <li>La responsabilité de Skynote est limitée au montant des sommes versées au cours des 12 derniers mois</li>
              <li>Skynote n'est pas responsable des contenus importés par les utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">11. Modification des CGU</h2>
            <p>Skynote se réserve le droit de modifier ces CGU. En cas de modification substantielle :</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>Tu seras informé par email au moins 30 jours avant l'entrée en vigueur</li>
              <li>La version en vigueur est toujours accessible à cette adresse avec sa date et son numéro de version</li>
              <li>La poursuite de l'utilisation après la date d'effet vaut acceptation des nouvelles conditions</li>
              <li>En cas de désaccord, tu peux supprimer ton compte avant la date d'entrée en vigueur</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">12. Droit applicable et litiges</h2>
            <p>Les présentes CGU sont soumises au <strong>droit français</strong>.</p>
            <p className="mt-2">En cas de litige, une solution amiable sera recherchée en priorité. Pour ce faire, contacte-nous à <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a>.</p>
            <p className="mt-2">Conformément à l'article L.612-1 du Code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation. Le médiateur compétent est :</p>
            <div className="mt-2 rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
              <p><strong>Médiateur du numérique — Médiateur des communications électroniques</strong></p>
              <p className="mt-1 text-text-secondary dark:text-text-dark-secondary">
                <a href="https://www.mediateur-des-communications-electroniques.fr" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">mediateur-des-communications-electroniques.fr</a>
              </p>
            </div>
            <p className="mt-3 text-[13px] text-text-secondary dark:text-text-dark-secondary">
              À défaut de résolution amiable, tout litige sera soumis aux tribunaux compétents du ressort du domicile du défendeur, conformément au droit commun français. Pour les litiges transfrontaliers au sein de l'UE : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">ec.europa.eu/consumers/odr</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">13. Contact</h2>
            <p>Pour toute question relative aux présentes CGU :</p>
            <p className="mt-2"><a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></p>
          </section>

        </div>

        <div className="mt-12 border-t border-sky-border dark:border-night-border pt-6 flex flex-wrap gap-4">
          <Link href="/mentions-legales" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Mentions légales
          </Link>
          <Link href="/privacy" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Politique de confidentialité
          </Link>
          <Link href="/dashboard" className="font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary">
            Retour à l'app
          </Link>
        </div>
      </div>
    </div>
  )
}
