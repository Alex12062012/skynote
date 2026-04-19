import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mentions légales — Skynote' }

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-2">
          Mentions légales
        </h1>
        <p className="font-body text-[14px] text-text-tertiary dark:text-text-dark-tertiary mb-10">
          Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN). Dernière mise à jour : avril 2026.
        </p>

        <div className="space-y-8 font-body text-[15px] text-text-main dark:text-text-dark-main leading-relaxed">

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">1. Éditeur du site</h2>
            <p><strong>Skynote</strong> est édité par :</p>
            <ul className="mt-2 space-y-1 pl-0 list-none">
              <li><strong>Nom :</strong> Alexandre Roudaut</li>
              <li><strong>Statut :</strong> Micro-entrepreneur (auto-entrepreneur)</li>
              <li><strong>Activité :</strong> Édition de logiciels applicatifs (NAF 5829C)</li>
              <li><strong>SIRET :</strong> Disponible sur demande à <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></li>
              <li><strong>Email :</strong> <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></li>
              <li><strong>Directeur de la publication :</strong> Alexandre Roudaut</li>
            </ul>
            <p className="mt-3 text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Conformément à l'article L.123-10 du Code de commerce, le numéro SIRET est communiqué sur simple demande écrite adressée à l'adresse email ci-dessus.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">2. Hébergement</h2>
            <p><strong>Application web :</strong></p>
            <p className="mt-1 ml-4">
              Vercel Inc.<br />
              340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">vercel.com</a>
            </p>
            <p className="mt-3"><strong>Base de données :</strong></p>
            <p className="mt-1 ml-4">
              Supabase Inc.<br />
              Infrastructure AWS, région Europe (eu-west-1, Irlande)<br />
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">supabase.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">3. Traitement des données personnelles</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés modifiée, les utilisateurs disposent des droits suivants :</p>
            <div className="mt-3 space-y-2">
              {[
                ['Droit d\'accès (art. 15 RGPD)', 'Obtenir la confirmation que des données vous concernant sont traitées et en recevoir une copie.'],
                ['Droit de rectification (art. 16 RGPD)', 'Faire corriger des données inexactes ou incomplètes.'],
                ['Droit à l\'effacement (art. 17 RGPD)', 'Demander la suppression de vos données (droit à l\'oubli), dans les conditions prévues par le RGPD.'],
                ['Droit à la portabilité (art. 20 RGPD)', 'Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.'],
                ['Droit d\'opposition (art. 21 RGPD)', 'Vous opposer au traitement de vos données pour des motifs légitimes.'],
                ['Droit à la limitation (art. 18 RGPD)', 'Demander le gel temporaire du traitement de vos données.'],
                ['Droit de ne pas faire l\'objet d\'une décision automatisée (art. 22 RGPD)', 'Ne pas faire l\'objet d\'une décision produite exclusivement par un traitement automatisé.'],
              ].map(([right, desc]) => (
                <div key={right} className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                  <p className="font-semibold text-[14px]">{right}</p>
                  <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à :{' '}
              <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a>
            </p>
            <p className="mt-1 text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Nous répondrons à votre demande dans un délai d'un mois (art. 12 RGPD), prorogeable de deux mois supplémentaires en cas de demande complexe.
            </p>
            <p className="mt-2">Vous pouvez également supprimer votre compte directement depuis la page Profil — toutes vos données sont effacées dans un délai de 30 jours.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">4. Bases légales des traitements</h2>
            <div className="space-y-3">
              <div className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                <p className="font-semibold">Exécution du contrat (art. 6.1.b RGPD)</p>
                <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary mt-1">Inscription, authentification, création et stockage des cours, génération de fiches et QCM, gestion de l'abonnement et du paiement.</p>
              </div>
              <div className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                <p className="font-semibold">Intérêt légitime (art. 6.1.f RGPD)</p>
                <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary mt-1">Statistiques d'utilisation anonymisées, amélioration du service, classement gamifié (leaderboard avec pseudos uniquement), système de Sky Coins et objectifs de progression.</p>
              </div>
              <div className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                <p className="font-semibold">Consentement (art. 6.1.a RGPD)</p>
                <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary mt-1">Feedbacks volontaires, choix d'un pseudo public pour le classement. Ce consentement peut être retiré à tout moment sans affecter la légalité du traitement antérieur.</p>
              </div>
              <div className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                <p className="font-semibold">Obligation légale (art. 6.1.c RGPD)</p>
                <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary mt-1">Conservation des données de facturation conformément aux obligations comptables et fiscales (10 ans).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">5. Sous-traitants et transferts hors UE</h2>
            <p className="mb-3">Skynote fait appel aux sous-traitants suivants. Chacun présente des garanties appropriées au sens de l'article 46 du RGPD :</p>
            <div className="space-y-2">
              {[
                ['Vercel Inc.', 'Hébergement de l\'application', 'États-Unis', 'EU-US Data Privacy Framework'],
                ['Supabase Inc. (AWS eu-west-1)', 'Base de données', 'Irlande (UE)', 'Données hébergées en Europe — pas de transfert hors UE'],
                ['Anthropic PBC', 'Génération IA (fiches et QCM)', 'États-Unis', 'Clauses contractuelles types (SCC) — contenu des cours transmis temporairement, non conservé par Anthropic'],
                ['Stripe Inc.', 'Paiement en ligne', 'États-Unis', 'EU-US Data Privacy Framework — certifié PCI-DSS — Skynote ne stocke aucune donnée bancaire'],
              ].map(([name, role, location, guarantee]) => (
                <div key={name} className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[13px]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{name}</p>
                    <span className="flex-shrink-0 rounded-pill bg-sky-cloud dark:bg-night-border px-2 py-0.5 text-[11px] text-text-tertiary dark:text-text-dark-tertiary">{location}</span>
                  </div>
                  <p className="text-text-secondary dark:text-text-dark-secondary mt-0.5">{role}</p>
                  <p className="text-text-tertiary dark:text-text-dark-tertiary mt-1 italic">{guarantee}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">6. Durées de conservation</h2>
            <div className="space-y-2">
              {[
                ['Données de compte (email, prénom, progression)', 'Pendant toute la durée d\'activité du compte. Supprimées dans les 30 jours suivant la demande de suppression ou la fermeture du compte.'],
                ['Contenu des cours', 'Conservé tant que le compte est actif. Supprimé avec le compte.'],
                ['Données de facturation', '10 ans à compter de l\'émission de la facture (obligation légale comptable).'],
                ['Comptes inactifs', 'Les comptes sans connexion depuis plus de 24 mois pourront être supprimés après notification préalable par email avec un délai de 30 jours pour réagir.'],
                ['Logs techniques', '12 mois maximum.'],
                ['Données de consentement', 'Pendant toute la durée d\'utilisation et 5 ans après la suppression du compte (preuve de conformité).'],
              ].map(([type, duration]) => (
                <div key={type} className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                  <p className="font-semibold text-[14px]">{type}</p>
                  <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary mt-0.5">{duration}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">7. Protection des mineurs</h2>
            <p>Skynote est destiné aux élèves de 10 à 17 ans. Conformément à l'article 8 du RGPD et à l'article 45 de la loi Informatique et Libertés modifiée :</p>
            <ul className="mt-3 space-y-2 pl-0 list-none">
              <li className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                <strong>15 ans et plus :</strong> L'utilisateur peut s'inscrire et consentir seul au traitement de ses données.
              </li>
              <li className="rounded-input border border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20 p-3 text-[14px]">
                <strong>10 à 14 ans :</strong> L'accord d'un parent ou représentant légal est obligatoire. Le processus d'inscription envoie un code de vérification à l'email du parent — en transmettant ce code à l'enfant, le parent confirme son autorisation et accepte les présentes conditions au nom de son enfant.
              </li>
            </ul>
            <p className="mt-3 text-[13px] text-text-secondary dark:text-text-dark-secondary">Aucune donnée d'identification directe (nom complet) n'est affichée publiquement. Le classement utilise uniquement des pseudos choisis par l'utilisateur ou des identifiants anonymes (user_XXXX).</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">8. Cookies</h2>
            <p>Skynote utilise <strong>uniquement des cookies techniques strictement nécessaires</strong> au fonctionnement de l'authentification (session Supabase Auth). Ces cookies ne collectent aucune donnée personnelle à des fins publicitaires ou de tracking.</p>
            <p className="mt-2 text-[13px] text-text-secondary dark:text-text-dark-secondary">Conformément aux recommandations de la CNIL (délibération n° 2020-091), aucun consentement n'est requis pour ces cookies, qui sont exemptés de la règle de consentement.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">9. Sécurité des données</h2>
            <p>Skynote met en œuvre les mesures techniques et organisationnelles suivantes :</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>Chiffrement des communications via HTTPS/TLS 1.3</li>
              <li>Accès aux données protégé par Row Level Security (RLS) — chaque utilisateur n'accède qu'à ses propres données</li>
              <li>Authentification par code OTP à usage unique (sans mot de passe stocké)</li>
              <li>Accès administrateur limité et auditable</li>
              <li>Infrastructure hébergée en Europe (Supabase/AWS eu-west-1)</li>
            </ul>
            <p className="mt-3 text-[13px] text-text-secondary dark:text-text-dark-secondary">En cas de violation de données à caractère personnel susceptible d'engendrer un risque élevé pour vos droits et libertés, vous serez notifié dans les meilleurs délais conformément à l'article 34 du RGPD.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">10. Réclamations — CNIL</h2>
            <p>En cas de litige ou de plainte non résolue, vous pouvez adresser une réclamation à l'autorité de contrôle compétente :</p>
            <div className="mt-3 rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-4 text-[14px]">
              <p className="font-semibold">Commission Nationale de l'Informatique et des Libertés (CNIL)</p>
              <p className="mt-1 text-text-secondary dark:text-text-dark-secondary">3 Place de Fontenoy, TSA 80715 — 75334 Paris Cedex 07</p>
              <p className="mt-1">
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">cnil.fr/fr/plaintes</a>
                {' '}— Tél. : 01 53 73 22 22
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">11. Propriété intellectuelle</h2>
            <p>L'ensemble du site Skynote (design, code, textes, logos, marque) est protégé par le droit d'auteur et le droit des marques. Toute reproduction, représentation ou diffusion sans autorisation expresse est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.</p>
            <p className="mt-2">Le contenu importé par les utilisateurs (cours, notes personnelles) reste leur propriété exclusive. En utilisant Skynote, l'utilisateur accorde une licence limitée, non exclusive et non transférable pour le traitement de ce contenu aux seules fins de fourniture du service.</p>
          </section>

        </div>

        <div className="mt-12 border-t border-sky-border dark:border-night-border pt-6 flex flex-wrap gap-4">
          <Link href="/privacy" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Politique de confidentialité
          </Link>
          <Link href="/terms" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            CGU
          </Link>
          <Link href="/dashboard" className="font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary">
            Retour à l'app
          </Link>
        </div>
      </div>
    </div>
  )
}
