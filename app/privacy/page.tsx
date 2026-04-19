import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Politique de confidentialité — Skynote' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-2">
          Politique de confidentialité
        </h1>
        <p className="font-body text-[14px] text-text-tertiary dark:text-text-dark-tertiary mb-10">
          Dernière mise à jour : avril 2026 — Version 1.2
        </p>

        <div className="space-y-8 font-body text-[15px] text-text-main dark:text-text-dark-main leading-relaxed">

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">1. Qui sommes-nous ?</h2>
            <p><strong>Skynote</strong> est une application éducative développée par Alexandre Roudaut, micro-entrepreneur basé en France. Elle permet aux élèves de transformer leurs cours en fiches de révision et QCM grâce à l'intelligence artificielle.</p>
            <p className="mt-2">Contact : <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></p>
            <p className="mt-1 text-[13px] text-text-secondary dark:text-text-dark-secondary">Responsable du traitement au sens du RGPD : Alexandre Roudaut, éditeur de Skynote.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">2. Données collectées</h2>
            <p className="mb-3">Nous collectons uniquement les données strictement nécessaires au fonctionnement de l'application (principe de minimisation, art. 5.1.c RGPD) :</p>
            <div className="space-y-2">
              {[
                { data: 'Adresse email', purpose: 'Création de compte, authentification, communications essentielles', basis: 'Contrat' },
                { data: 'Prénom', purpose: 'Personnalisation de l\'expérience', basis: 'Contrat' },
                { data: 'Date de naissance', purpose: 'Vérification de l\'âge et application du consentement parental', basis: 'Obligation légale' },
                { data: 'Niveau scolaire', purpose: 'Adaptation des contenus générés', basis: 'Contrat' },
                { data: 'Pseudo public', purpose: 'Affichage dans le classement (leaderboard)', basis: 'Consentement' },
                { data: 'Contenu des cours importés', purpose: 'Traitement par l\'IA pour générer fiches et QCM — non conservé par l\'IA', basis: 'Contrat' },
                { data: 'Données de progression', purpose: 'Scores QCM, streak, Sky Coins, badges, skins débloqués', basis: 'Contrat' },
                { data: 'Dates d\'inscription et de connexion', purpose: 'Sécurité, statistiques de la plateforme', basis: 'Intérêt légitime' },
                { data: 'Données de feedback (optionnel)', purpose: 'Amélioration du service', basis: 'Consentement' },
                { data: 'Acceptation des CGU (horodatage + version)', purpose: 'Preuve de conformité RGPD', basis: 'Obligation légale' },
              ].map(({ data, purpose, basis }) => (
                <div key={data} className="flex items-start gap-3 rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-text-main dark:text-text-dark-main">{data}</p>
                    <p className="text-[12px] text-text-secondary dark:text-text-dark-secondary mt-0.5">{purpose}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-pill bg-brand-soft dark:bg-brand-dark-soft px-2 py-0.5 text-[11px] font-medium text-brand dark:text-brand-dark">
                    {basis}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">3. Ce que nous ne faisons jamais</h2>
            <div className="rounded-card border border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-950/20 p-4">
              <ul className="space-y-2 text-[14px]">
                {[
                  'Nous ne vendons jamais tes données à des tiers',
                  'Nous ne partageons pas tes données à des fins publicitaires',
                  'Nous ne profilons pas tes données à des fins commerciales',
                  'Nous n\'utilisons pas de publicités ou de traceurs tiers',
                  'Nous ne conservons pas le contenu de tes cours après génération des fiches',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">4. Intelligence artificielle (Anthropic)</h2>
            <p>Le contenu de tes cours est transmis à <strong>Anthropic PBC</strong> (Claude AI) pour générer tes fiches de révision et QCM. Points importants :</p>
            <ul className="mt-3 space-y-2 pl-0 list-none">
              <li className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                <strong>Traitement temporaire :</strong> Le contenu est transmis uniquement le temps de la génération et n'est pas conservé par Anthropic pour entraîner ses modèles (conformément aux termes du contrat API).
              </li>
              <li className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                <strong>Données transmises :</strong> Uniquement le contenu du cours, sans aucune information d'identification (email, nom, etc.).
              </li>
              <li className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                <strong>Encadrement légal :</strong> Clauses contractuelles types (SCC) conformes au RGPD. Politique d'Anthropic : <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">anthropic.com/privacy</a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">5. Hébergement et sécurité</h2>
            <p>Tes données sont hébergées sur <strong>Supabase</strong> (infrastructure AWS, région Europe — Irlande) et l'application est déployée sur <strong>Vercel</strong>.</p>
            <ul className="mt-3 space-y-1 pl-4 list-disc text-[14px]">
              <li>Communications chiffrées via HTTPS/TLS 1.3</li>
              <li>Accès aux données protégé par Row Level Security (RLS) — tu n'accèdes qu'à tes propres données</li>
              <li>Authentification sans mot de passe (code OTP à usage unique)</li>
              <li>Sauvegardes chiffrées automatiques</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">6. Conservation des données</h2>
            <div className="space-y-2">
              {[
                ['Données de compte', 'Pendant toute la durée d\'activité du compte. Supprimées dans les 30 jours suivant la demande.'],
                ['Contenu des cours', 'Tant que le compte est actif. Supprimé avec le compte.'],
                ['Données de facturation', '10 ans (obligation légale comptable).'],
                ['Comptes inactifs', 'Notification après 24 mois d\'inactivité, suppression si pas de réponse dans les 30 jours.'],
                ['Preuve de consentement', 'Horodatage conservé 5 ans après suppression du compte.'],
              ].map(([type, duration]) => (
                <div key={type} className="flex items-start gap-3 rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                  <span className="font-semibold min-w-fit">{type} —</span>
                  <span className="text-text-secondary dark:text-text-dark-secondary">{duration}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">7. Tes droits (RGPD)</h2>
            <p className="mb-3">Conformément au RGPD, tu disposes des droits suivants. Tu peux les exercer à tout moment :</p>
            <div className="space-y-2">
              {[
                ['Accès', 'Obtenir une copie de toutes tes données'],
                ['Rectification', 'Corriger des informations inexactes — depuis la page Profil directement'],
                ['Effacement', 'Supprimer ton compte et toutes tes données — depuis la page Profil ou par email'],
                ['Portabilité', 'Recevoir tes données dans un format lisible par machine (JSON)'],
                ['Opposition', 'T\'opposer au traitement pour des motifs légitimes (hors traitement contractuel)'],
                ['Limitation', 'Demander le gel temporaire du traitement'],
              ].map(([right, desc]) => (
                <div key={right} className="flex items-start gap-3 rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3">
                  <span className="font-semibold text-[14px] min-w-[110px]">{right}</span>
                  <span className="text-[13px] text-text-secondary dark:text-text-dark-secondary">{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-4">
              Pour exercer tes droits :{' '}
              <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a>
              {' '}— Réponse garantie sous 1 mois.
            </p>
            <p className="mt-2 text-[13px] text-text-secondary dark:text-text-dark-secondary">
              Tu peux également déposer une plainte auprès de la{' '}
              <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">CNIL</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">8. Mineurs</h2>
            <p>Skynote est destiné aux élèves de collège et lycée (10 à 17 ans).</p>
            <ul className="mt-3 space-y-2 pl-0 list-none">
              <li className="rounded-input border border-sky-border bg-sky-surface dark:border-night-border dark:bg-night-surface p-3 text-[14px]">
                <strong>15 ans et plus :</strong> peuvent s'inscrire et consentir seuls.
              </li>
              <li className="rounded-input border border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20 p-3 text-[14px]">
                <strong>10 à 14 ans :</strong> l'accord parental est obligatoire. Le parent reçoit un code de vérification — en le transmettant à l'enfant, il autorise l'inscription et le traitement des données de son enfant.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">9. Cookies</h2>
            <p>Skynote utilise <strong>uniquement des cookies techniques de session</strong> nécessaires au fonctionnement de l'authentification. Ces cookies :</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>Ne contiennent aucune donnée personnelle exploitable à des fins publicitaires</li>
              <li>Ne sont pas partagés avec des tiers</li>
              <li>Sont exemptés de l'obligation de consentement (délibération CNIL n° 2020-091)</li>
            </ul>
            <p className="mt-2 text-[13px] text-text-secondary dark:text-text-dark-secondary">Aucun bandeau cookie n'est requis pour ces cookies strictement nécessaires.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">10. Violations de données</h2>
            <p>En cas de violation de données à caractère personnel présentant un risque élevé pour tes droits et libertés, Skynote s'engage à :</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-[14px]">
              <li>Notifier la CNIL dans les 72 heures (art. 33 RGPD)</li>
              <li>Te notifier personnellement dans les meilleurs délais (art. 34 RGPD)</li>
              <li>Décrire la nature de la violation et les mesures prises pour y remédier</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">11. Modifications de cette politique</h2>
            <p>En cas de modification substantielle de cette politique de confidentialité, tu seras informé par email au moins 30 jours avant l'entrée en vigueur des changements. La version en vigueur est toujours accessible à cette adresse.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">12. Contact</h2>
            <p>Pour toute question relative à tes données personnelles :</p>
            <p className="mt-2">
              <strong>Email :</strong>{' '}
              <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a>
            </p>
            <p className="mt-1">
              <strong>CNIL :</strong>{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brand dark:text-brand-dark hover:underline">cnil.fr</a>
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-sky-border dark:border-night-border pt-6 flex flex-wrap gap-4">
          <Link href="/mentions-legales" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Mentions légales
          </Link>
          <Link href="/terms" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Conditions d'utilisation
          </Link>
          <Link href="/dashboard" className="font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary">
            Retour à l'app
          </Link>
        </div>
      </div>
    </div>
  )
}
