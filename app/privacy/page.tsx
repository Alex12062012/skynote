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
          Dernière mise à jour : mars 2026
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 font-body text-[15px] text-text-main dark:text-text-dark-main leading-relaxed">

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">1. Qui sommes-nous ?</h2>
            <p>Skynote est une application éducative développée par Alex, basée en France. Elle permet aux élèves de transformer leurs cours en fiches de révision et QCM grâce à l'intelligence artificielle.</p>
            <p className="mt-2">Contact : <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">2. Données collectées</h2>
            <p>Dans le cadre de l'utilisation de Skynote, nous collectons uniquement les données nécessaires au fonctionnement de l'application :</p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                ['Adresse email', 'Création de compte et authentification'],
                ['Prénom', 'Personnalisation de l\'expérience (optionnel)'],
                ['Contenu des cours', 'Traitement par l\'IA pour générer les fiches et QCM'],
                ['Données de progression', 'Fiches maîtrisées, scores QCM, streak de connexion, Sky Coins'],
                ['Date d\'inscription et de dernière connexion', 'Statistiques de la plateforme'],
              ].map(([data, purpose]) => (
                <li key={data} className="flex items-start gap-3 rounded-input bg-sky-surface dark:bg-night-surface border border-sky-border dark:border-night-border p-3">
                  <span className="font-semibold text-text-main dark:text-text-dark-main min-w-fit">{data}</span>
                  <span className="text-text-secondary dark:text-text-dark-secondary text-[13px]">→ {purpose}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">3. Utilisation des données</h2>
            <p>Tes données sont utilisées exclusivement pour :</p>
            <ul className="mt-2 space-y-1 pl-4">
              {[
                'Faire fonctionner l\'application et générer tes fiches',
                'Personnaliser ton expérience de révision',
                'Améliorer la qualité du service',
                'T\'envoyer des emails liés à ton compte (vérification, notifications importantes)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-brand dark:text-brand-dark mt-1">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-semibold">Nous ne vendons jamais tes données. Nous ne les partageons pas avec des tiers à des fins publicitaires.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">4. Hébergement et sécurité</h2>
            <p>Tes données sont hébergées sur <strong>Supabase</strong> (infrastructure AWS, région Europe) et l'application est déployée sur <strong>Vercel</strong>. Les communications sont chiffrées via HTTPS/TLS. L'accès aux données est protégé par des règles de sécurité strictes (Row Level Security).</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">5. Conservation des données</h2>
            <p>Tes données sont conservées tant que ton compte est actif. En cas de suppression de compte, toutes tes données sont définitivement effacées dans un délai de 30 jours.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">6. Tes droits (RGPD)</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), tu disposes des droits suivants :</p>
            <ul className="mt-2 space-y-1 pl-4">
              {[
                'Droit d\'accès à tes données',
                'Droit de rectification',
                'Droit à l\'effacement (droit à l\'oubli)',
                'Droit à la portabilité',
                'Droit d\'opposition au traitement',
              ].map((right) => (
                <li key={right} className="flex items-start gap-2">
                  <span className="text-brand dark:text-brand-dark">→</span>
                  <span>{right}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">Pour exercer ces droits, contacte-nous à <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a>. Tu peux aussi supprimer ton compte directement depuis la page Profil.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">7. Mineurs</h2>
            <p>Skynote est destiné aux élèves de collège et lycée. Les utilisateurs de moins de 15 ans doivent avoir l'autorisation d'un représentant légal pour utiliser l'application. En t'inscrivant, tu confirmes avoir 15 ans ou plus, ou disposer de cette autorisation.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">8. Intelligence artificielle</h2>
            <p>Le contenu de tes cours est transmis à <strong>Anthropic</strong> (Claude AI) pour générer tes fiches de révision et QCM. Ce traitement est temporaire et ne sert qu'à produire tes fiches. Anthropic applique sa propre politique de confidentialité disponible sur <a href="https://www.anthropic.com/privacy" target="_blank" className="text-brand dark:text-brand-dark hover:underline">anthropic.com/privacy</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">9. Cookies</h2>
            <p>Skynote utilise uniquement des cookies techniques nécessaires au fonctionnement de l'authentification. Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">10. Contact et réclamations</h2>
            <p>Pour toute question : <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></p>
            <p className="mt-2">Tu peux également adresser une réclamation à la <strong>CNIL</strong> : <a href="https://www.cnil.fr" target="_blank" className="text-brand dark:text-brand-dark hover:underline">cnil.fr</a></p>
          </section>

        </div>

        <div className="mt-12 border-t border-sky-border dark:border-night-border pt-6 flex gap-4">
          <Link href="/terms" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Conditions d'utilisation →
          </Link>
          <Link href="/dashboard" className="font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary">
            Retour à l'app
          </Link>
        </div>
      </div>
    </div>
  )
}
