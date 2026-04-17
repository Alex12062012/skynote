import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mentions legales — Skynote' }

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-sky-bg dark:bg-night-bg px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <h1 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-2">
          Mentions legales
        </h1>
        <p className="font-body text-[14px] text-text-tertiary dark:text-text-dark-tertiary mb-10">
          Conformement a la loi n 2004-575 du 21 juin 2004 pour la confiance dans l economie numerique.
        </p>

        <div className="space-y-8 font-body text-[15px] text-text-main dark:text-text-dark-main leading-relaxed">

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">1. Editeur du site</h2>
            <p>Skynote est edite par Alex (micro-entrepreneur).</p>
            <p className="mt-2">Email : <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></p>
            <p>Directeur de la publication : Alex</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">2. Hebergement</h2>
            <p>L application est hebergee par :</p>
            <p className="mt-2"><strong>Vercel Inc.</strong><br />340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />Site : <a href="https://vercel.com" target="_blank" className="text-brand dark:text-brand-dark hover:underline">vercel.com</a></p>
            <p className="mt-2">La base de donnees est hebergee par :</p>
            <p className="mt-1"><strong>Supabase Inc.</strong><br />Infrastructure AWS, region Europe (eu-west)<br />Site : <a href="https://supabase.com" target="_blank" className="text-brand dark:text-brand-dark hover:underline">supabase.com</a></p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">3. Traitement des donnees personnelles</h2>
            <p>Conformement au Reglement General sur la Protection des Donnees (RGPD - Reglement UE 2016/679), les utilisateurs disposent des droits suivants sur leurs donnees personnelles :</p>
            <p className="mt-2"><strong>Droit d acces</strong> — Obtenir la confirmation que des donnees vous concernant sont traitees et en recevoir une copie.</p>
            <p className="mt-1"><strong>Droit de rectification</strong> — Faire corriger des donnees inexactes ou incompletes.</p>
            <p className="mt-1"><strong>Droit a l effacement</strong> — Demander la suppression de vos donnees dans les conditions prevues par le RGPD.</p>
            <p className="mt-1"><strong>Droit a la portabilite</strong> — Recevoir vos donnees dans un format structure et lisible par machine.</p>
            <p className="mt-1"><strong>Droit d opposition</strong> — Vous opposer au traitement de vos donnees pour des motifs legitimes.</p>
            <p className="mt-1"><strong>Droit a la limitation</strong> — Demander le gel temporaire du traitement de vos donnees.</p>
            <p className="mt-3">Pour exercer ces droits : <a href="mailto:contact@skynote.app" className="text-brand dark:text-brand-dark hover:underline">contact@skynote.app</a></p>
            <p className="mt-1">Vous pouvez egalement supprimer votre compte directement depuis la page Profil.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">4. Bases legales des traitements</h2>
            <p className="mt-2"><strong>Execution du contrat (art. 6.1.b RGPD)</strong> — Inscription, authentification, creation et stockage des cours, generation de fiches et QCM, gestion de l abonnement et du paiement.</p>
            <p className="mt-1"><strong>Interet legitime (art. 6.1.f RGPD)</strong> — Statistiques d utilisation anonymisees, amelioration du service, classement gamifie (leaderboard avec pseudos uniquement), systeme de Sky Coins et objectifs.</p>
            <p className="mt-1"><strong>Consentement (art. 6.1.a RGPD)</strong> — Envoi de communications promotionnelles (si mis en place), feedbacks volontaires, choix d un pseudo public pour le classement.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">5. Transferts de donnees hors UE</h2>
            <p>Certains sous-traitants sont situes aux Etats-Unis :</p>
            <p className="mt-2"><strong>Vercel Inc.</strong> (hebergement) — Conforme au EU-US Data Privacy Framework.</p>
            <p className="mt-1"><strong>Anthropic PBC</strong> (generation IA) — Le contenu des cours est transmis temporairement pour generer les fiches et QCM. Aucune donnee n est conservee par Anthropic apres le traitement. Clauses contractuelles types (SCC) applicables.</p>
            <p className="mt-1"><strong>Stripe Inc.</strong> (paiement) — Certifie PCI-DSS. Conforme au EU-US Data Privacy Framework.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">6. Duree de conservation</h2>
            <p><strong>Donnees de compte</strong> — Conservees tant que le compte est actif. Supprimees sous 30 jours apres demande de suppression.</p>
            <p className="mt-1"><strong>Comptes inactifs</strong> — Les comptes sans connexion depuis plus de 24 mois pourront etre supprimes apres notification par email.</p>
            <p className="mt-1"><strong>Donnees de paiement</strong> — Gerees directement par Stripe. Skynote ne stocke aucune donnee bancaire.</p>
            <p className="mt-1"><strong>Logs techniques</strong> — Conserves 12 mois maximum.</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">7. Protection des mineurs</h2>
            <p>Skynote est destine aux eleves de 10 a 17 ans. Conformement a l article 8 du RGPD et a l article 45 de la loi Informatique et Libertes :</p>
            <p className="mt-2">Les utilisateurs de <strong>15 ans et plus</strong> peuvent s inscrire et consentir seuls au traitement de leurs donnees.</p>
            <p className="mt-1">Les utilisateurs de <strong>moins de 15 ans</strong> doivent obtenir l autorisation d un parent ou representant legal avant de s inscrire. En s inscrivant, l utilisateur declare avoir 15 ans ou plus, ou disposer de cette autorisation.</p>
            <p className="mt-2">Le plan Famille permet aux parents de creer et superviser les comptes de leurs enfants.</p>
            <p className="mt-2">Aucune donnee d identification directe (nom complet) n est affichee publiquement. Le classement utilise uniquement des pseudos choisis par l utilisateur ou des identifiants anonymes (user_X).</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">8. Cookies</h2>
            <p>Skynote utilise uniquement des cookies techniques strictement necessaires au fonctionnement de l authentification (Supabase Auth). Aucun cookie publicitaire, de tracking ou d analyse tiers n est utilise. Aucun consentement n est donc requis pour ces cookies (exemption CNIL).</p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">9. Reclamations</h2>
            <p>En cas de litige, vous pouvez adresser une reclamation a la CNIL :</p>
            <p className="mt-1"><strong>Commission Nationale de l Informatique et des Libertes</strong><br />3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br />Site : <a href="https://www.cnil.fr" target="_blank" className="text-brand dark:text-brand-dark hover:underline">cnil.fr</a></p>
          </section>

          <section>
            <h2 className="font-display text-[20px] font-bold mb-3">10. Propriete intellectuelle</h2>
            <p>L ensemble du site Skynote (design, code, textes, logos) est protege par le droit d auteur. Toute reproduction sans autorisation est interdite. Le contenu importe par les utilisateurs (cours) reste leur propriete.</p>
          </section>

        </div>

        <div className="mt-12 border-t border-sky-border dark:border-night-border pt-6 flex gap-4">
          <Link href="/privacy" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            Politique de confidentialite
          </Link>
          <Link href="/terms" className="font-body text-[14px] text-brand hover:underline dark:text-brand-dark">
            CGU
          </Link>
          <Link href="/dashboard" className="font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary">
            Retour a l app
          </Link>
        </div>
      </div>
    </div>
  )
}
