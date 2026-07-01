# Skynote

> Application SaaS éducative propulsée par l'IA, conçue pour les élèves de collège et lycée (10–17 ans).

**Site officiel :** [https://skynote.fr](https://skynote.fr)

Skynote transforme n'importe quel cours (texte, PDF, photo, vocal) en fiches de révision, QCM et chatbot personnalisé — en quelques secondes — grâce à Claude (Anthropic). L'app intègre un système de répétition espacée (SM-2), une économie de Sky Coins, un leaderboard saisonnier et un espace classe pour les enseignants.

---

## Table des matières

1. [Stack technique](#stack-technique)
2. [Architecture du projet](#architecture-du-projet)
3. [Fonctionnalités](#fonctionnalités)
4. [Base de données](#base-de-données)
5. [API Routes](#api-routes)
6. [Système de gamification](#système-de-gamification)
7. [Plans et Paiement](#plans-et-paiement)
8. [Authentification](#authentification)
9. [i18n](#i18n)
10. [Déploiement](#déploiement)
11. [Installation locale](#installation-locale)
12. [Variables d'environnement](#variables-denvironnement)
13. [Migrations SQL](#migrations-sql)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript 5 |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email OTP, Google, GitHub) |
| Storage | Supabase Storage (bucket course-files, max 10 Mo) |
| Realtime | Supabase Realtime (progression de génération) |
| IA | Anthropic Claude (@anthropic-ai/sdk) |
| Paiement | Stripe (abonnements mensuels et annuels) |
| CSS | Tailwind CSS 3 |
| Déploiement | Vercel |
| Perf | @vercel/speed-insights |

---

## Architecture du projet

```
skynote/
├── app/
│   ├── (auth)/               # Pages d'authentification
│   │   ├── login/
│   │   ├── signup/
│   │   ├── signup-teacher/

│   ├── (dashboard)/          # Espace élève (layout avec Navbar)
│   │   ├── dashboard/        # Accueil — cours récents, stats, streak
│   │   ├── courses/          # Liste des cours
│   │   │   ├── new/          # Création d'un cours
│   │   │   └── [id]/         # Fiche détail cours
│   │   │       └── qcm/      # Mode QCM pour un cours
│   │   ├── eval/             # Sessions d'évaluation SM-2
│   │   │   ├── new/
│   │   │   └── [id]/session/
│   │   ├── review/           # Révision espacée (cartes dues)
│   │   ├── objectives/       # Objectifs et récompenses
│   │   ├── leaderboard/      # Classement hebdo / mensuel / all-time
│   │   ├── boutique/         # Boutique Sky Coins
│   │   ├── profil/[pseudo]/  # Profil public d'un joueur
│   │   └── profile/          # Mon profil
│   ├── api/                  # API Routes Next.js
│   ├── auth/callback/        # Callback OAuth Supabase
│   ├── classroom-login/      # Connexion élève via code classe

│   ├── list-quiz/new/        # Créateur de quiz liste Q/R
│   ├── metrics/              # Dashboard métriques (admin)
│   ├── pricing/              # Page tarifs
│   ├── mentions-legales/
│   ├── privacy/
│   ├── terms/
│   └── page.tsx              # Landing page
├── components/
│   ├── admin/                # Dashboard administrateur
│   ├── auth/                 # Formulaires de connexion / inscription
│   ├── boutique/             # Roue de la fortune, catalogue
│   ├── classroom/            # Interface enseignant
│   ├── courses/              # Création, lecteur de fiches, QCM
│   ├── dashboard/            # Cards, stats, streak, bannières

│   ├── gamification/         # Badges, titres, skins, prestige, likes
│   ├── layout/               # Navbar
│   ├── leaderboard/          # Classement + modal pseudo
│   ├── list-quiz/            # Créateur et lecteur quiz manuel
│   ├── marketing/            # Landing page
│   └── objectives/           # Objectifs, bouton Premium
├── lib/
│   ├── ai/
│   │   ├── generate.ts       # Appels Claude (fiches + QCM)
│   │   ├── pipeline.ts       # Pipeline de traitement des cours
│   │   └── prompts.ts        # Prompts IA (fiches, QCM par difficulté)
│   ├── gamification/
│   │   ├── config.ts         # Source de vérité : coins, roue, badges, titres, skins
│   │   └── rewards.ts        # Calcul des récompenses
│   ├── i18n/
│   │   ├── translations.ts   # Dictionnaire fr / en / ru / zh
│   │   ├── context.tsx       # Provider React
│   │   └── server.ts         # Résolution côté serveur
│   ├── supabase/             # Server Actions Next.js
│   │   ├── actions.ts
│   │   ├── course-actions.ts
│   │   ├── qcm-actions.ts
│   │   ├── eval-actions.ts
│   │   ├── review-actions.ts
│   │   ├── objectives-actions.ts
│   │   ├── gamification-actions.ts

│   │   ├── referral-actions.ts
│   │   ├── error-analysis-actions.ts
│   │   ├── claim-actions.ts
│   │   ├── plan.ts           # Vérification du plan free/premium
│   │   ├── queries.ts
│   │   ├── client.ts         # Client Supabase (browser)
│   │   ├── server.ts         # Client Supabase (server)
│   │   └── middleware.ts     # Refresh session
│   ├── stripe/
│   │   └── config.ts         # Clés, price IDs, URLs de redirection
│   ├── storage/
│   │   └── upload.ts         # Upload vers Supabase Storage
│   ├── sm2.ts                # Algorithme SM-2

│   └── utils.ts
├── types/
│   ├── database.ts           # Types générés depuis le schéma Supabase
│   └── index.ts
├── supabase/
│   └── migrations/           # 21 migrations SQL
├── middleware.ts
├── next.config.mjs           # Config Next.js + CSP headers
├── vercel.json               # Timeout API à 60s
└── tailwind.config.ts
```

---

## Fonctionnalités

### Création de cours (4 sources)

- **Texte** : copier-coller le contenu brut du cours
- **PDF** : upload (max 10 Mo, stocké dans Supabase Storage)
- **Photo** : photo du cahier, texte extrait par Claude Vision via `/api/extract-photo`
- **Vocal** : enregistrement audio transcrit via l'API

Le cours passe par un pipeline (`lib/ai/pipeline.ts`) qui extrait le texte, génère les fiches via Claude, génère les QCM en batch, puis met à jour le statut en Realtime (`processing → ready`).

### Fiches de révision

Générées par Claude avec contraintes strictes : 3 à 6 fiches par cours (idéalement 4), exactement 3 points-clés par fiche, résumé en 1–2 phrases, titres de 3–6 mots. La langue est auto-détectée ou sélectionnable parmi 10 options (fr, en, es, de, it, pt, ar, ja, zh, auto).

### QCM

4 niveaux de difficulté avec des instructions de prompt distinctes :

| Niveau | Label | Coins si parfait |
|---|---|---|
| peaceful | Paisible | 2 |
| easy | Normal | 5 |
| medium | Hardcore | 10 |
| hard | Teste tes parents | 15 |

Chaque question inclut l'énoncé, 4 options, l'index de la bonne réponse et une explication.

### Répétition espacée — SM-2

Implémenté dans `lib/sm2.ts`. Grades : 0 (Again), 3 (Hard), 4 (Good), 5 (Easy). L'ease factor (min 1.3) et l'intervalle en jours sont recalculés à chaque révision. Historique dans `flashcard_reviews`. Coins : 0 / 1 / 2 / 3 selon le grade.

### Chatbot IA par cours

Route `/api/chat` — chatbot contextuel Claude. Le contenu de la fiche sert de contexte système. L'élève pose ses questions directement sur son cours.

### Quiz liste (sans IA)

L'élève crée ses propres paires question/réponse et les joue en mode flashcard. Stocké dans `list_quizzes` et `list_quiz_sessions`.

### Classe virtuelle (Enseignants)

Un enseignant peut créer une classe (code à 6 caractères), ajouter des élèves avec un `login_code` unique, créer des dossiers de cours partagés, voir le classement de ses élèves et ajouter des co-enseignants. Les élèves se connectent via `/classroom-login` sans email ni mot de passe.

---

## Base de données

21 migrations Supabase. RLS activé sur toutes les tables.

| Table | Description |
|---|---|
| profiles | Utilisateurs (plan, streak, Sky Coins, prestige, stats) |
| courses | Cours (source, statut, progression) |
| flashcards | Fiches générées + colonnes SM-2 (ease, interval, repetitions) |
| qcm_questions | Questions QCM avec options et explication |
| qcm_attempts | Historique des tentatives QCM |
| flashcard_reviews | Historique SM-2 (grade, interval avant/après) |
| objectives | Objectifs globaux (seeded en DB) |
| user_objectives | Progression par utilisateur + claimed |
| coin_transactions | Journal des transactions Sky Coins |
| classrooms | Classes virtuelles |
| classroom_students | Élèves d'une classe |
| list_quizzes | Quiz manuels Q/R |
| list_quiz_sessions | Sessions de ces quiz |
| user_titles | Titres débloqués |
| user_badges | Badges cosmétiques débloqués |

Le bucket `course-files` est privé. Les fichiers ne sont accessibles qu'à leur propriétaire via les policies Storage.

---

## API Routes

Timeout Vercel : **60 secondes** sur toutes les routes.

| Route | Méthode | Description |
|---|---|---|
| /api/generate | POST | Génère les fiches Claude pour un cours |
| /api/generate-qcm | POST | Génère les QCM pour une fiche |
| /api/generate-qcm/batch | POST | Génération QCM en masse |
| /api/mark-qcm-ready | POST | Marque les QCM comme prêts |
| /api/qcm-questions | GET | Récupère les questions d'un QCM |
| /api/extract-photo | POST | Extrait le texte d'une image (Claude Vision) |
| /api/chat | POST | Chatbot IA contextuel par cours |
| /api/update-streak | POST | Met à jour le streak quotidien |
| /api/set-pseudo | POST | Définit le pseudo leaderboard |
| /api/boutique/spin | POST | Lance la roue de la fortune |
| /api/list-quiz/create | POST | Crée un quiz manuel |
| /api/list-quiz/complete | POST | Enregistre une session de quiz |
| /api/metrics | GET | Métriques globales de l'app |
| /api/stripe/create-checkout | POST | Crée une session de paiement Stripe |
| /api/stripe/portal | POST | Accès au portail client Stripe |
| /api/stripe/webhook | POST | Webhook Stripe (mise à jour du plan) |
| /api/classroom/create | POST | Crée une classe |
| /api/classroom/login | POST | Connexion élève via login_code |
| /api/classroom/add-teacher | POST | Ajoute un co-enseignant |
| /api/classroom/create-folder | POST | Crée un dossier de cours |
| /api/classroom/settings | PATCH | Met à jour les paramètres de classe |
| /api/teacher-code-login | POST | Connexion enseignant via code |
| /api/admin/stats | GET | Statistiques admin |
| /api/admin/feedbacks | GET | Feedbacks utilisateurs |
| /api/admin/update-user | POST | Mise à jour admin d'un profil |
| /api/admin/beta | POST | Gestion accès bêta |

---

## Système de gamification

Toute la logique économique est centralisée dans `lib/gamification/config.ts`.

### Sky Coins

Gagnés en passant des QCM (selon difficulté et score), en révisant avec SM-2, en atteignant des objectifs, via les streaks (bonus à 3 et 5 jours) et l'early game boost (+5 coins par 5/5 sur les 10 premières fiches parfaites).

Scoring QCM : parfait 5/5 = ×1.0 — une erreur 4/5 = ×0.5 — deux erreurs ou plus = ×0.

### Prestige

Coût : `500 × (niveau + 1)` coins. Chaque niveau donne +5 % de multiplicateur de gains (cumulatif) et débloque un titre "Renaissance".

### Roue de la fortune

Coût : 50 coins. Espérance nette : –26 coins.

| Segment | Probabilité | Gain |
|---|---|---|
| Perdu | 40 % | 0 |
| +20 coins | 30 % | +20 |
| +40 coins | 15 % | +40 |
| +60 coins | 10 % | +60 |
| +100 coins | 4 % | +100 |
| +200 coins | 1 % | +200 |

### Badges et titres

7 badges achetables (rarité common → legendary). Titres en 4 catégories : skill, progression, casino, prestige. Exemples : "Machine à 5/5" (50 QCM parfaits), "Intouchable" (streak de 10 parfaits), "Renaissance I/II/III" (prestige).

### Skins de carte

15 skins : 10 normaux (rare) et 5 secrets (legendary), gagnables à la roue. Thèmes : Aube, Crépuscule, Aurore Boréale, Océan, Phœnix, Dragon, Cosmos, Prismatique…

### Leaderboard

3 périodes : hebdomadaire, mensuel, all-time. Paginé par 10. Les enseignants sont exclus.

### Objectifs

| Clé | Description | Récompense |
|---|---|---|
| first_course | Premier cours créé | 5 coins |
| perfect_qcm_10 | 10 QCM parfaits | 10 coins |
| streak_7 | 7 jours de suite | 20 coins |
| mastery_all | Toutes les fiches maîtrisées | 15 coins |
| five_courses | 5 cours créés | 25 coins |
| qcm_50 | 50 questions QCM | 30 coins |
| share_friend | Parrainage | 15 coins |

### Consommables

| Item | Prix | Effet |
|---|---|---|
| x2 coins (1h) | 50 coins | Double les gains pendant 1 heure |
| Retry QCM | 15 coins | Refaire un QCM sans pénalité (max 5) |
| Skip question | 10 coins | Passer une question (max 5) |

---

## Plans et Paiement

| Plan | Mensuel | Annuel |
|---|---|---|
| Free | Gratuit | — |
| Starter | 4,90 €/mois | 3,90 €/mois (46,80 €/an) |
| Pro | 6,90 €/mois | 5,90 €/mois (70,80 €/an) |


Le webhook `/api/lemonsqueezy/webhook` met à jour `plan` et `plan_expires_at` dans `profiles`. Le portail client LemonSqueezy permet la gestion autonome de l'abonnement.

---

## Authentification

| Méthode | Description |
|---|---|
| Email + OTP | Code à usage unique par email (expiry 600 s) |
| Google OAuth | Connexion via compte Google |
| GitHub OAuth | Connexion via compte GitHub |
| Code enseignant | Via /api/teacher-code-login |
| Code élève | login_code sans email (classe virtuelle) |

| Démo | Compte de démonstration pré-rempli |

À la création d'un compte, le trigger SQL `handle_new_user` crée automatiquement le profil dans `public.profiles`. Le middleware Next.js (`middleware.ts`) rafraîchit la session Supabase sur chaque requête.

---

## i18n

4 langues pour l'interface (`lib/i18n/translations.ts`) : français, English, Русский, 中文.

La langue des fiches et QCM générés est indépendante de l'interface : auto-détection depuis le contenu du cours, ou forcée parmi fr, en, es, de, it, pt, ar, ja, zh.

---

## Déploiement

Déployé sur Vercel. Timeout API : 60 s (`vercel.json`).

Headers de sécurité appliqués globalement via `next.config.mjs` :
- Content-Security-Policy strict (Supabase, Anthropic, Google Fonts uniquement)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

---

## Installation locale

```bash
# 1. Cloner le repo
git clone <url-du-repo>
cd skynote-complet

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.local.example .env.local

# 4. Appliquer les migrations Supabase
supabase db push

# 5. Lancer le serveur de développement
npm run dev
```

| Commande | Description |
|---|---|
| npm run dev | Serveur de développement |
| npm run build | Build de production |
| npm run start | Serveur de production |
| npm run lint | ESLint |
| npm run type-check | Vérification TypeScript sans emit |

---

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_cle_anon_publique
SUPABASE_SERVICE_ROLE_KEY=ta_cle_service_role_secrete

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Stripe (optionnel en dev)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PLUS_MONTHLY=
STRIPE_PRICE_PLUS_YEARLY=

# Email transactionnel (optionnel)
BREVO_API_KEY=
```

Note Supabase Auth : activer le mode OTP dans Supabase → Authentication → Email → expiry à 600 secondes.

Note Stripe : créer les produits dans le dashboard Stripe, puis copier les Price IDs dans les variables `STRIPE_PRICE_*`.

---

## Migrations SQL

| Migration | Contenu |
|---|---|
| 001 | Schéma initial (profiles, triggers) |
| 002 | Schéma complet (courses, flashcards, QCM, objectives, storage) |
| 003 | Système de parrainage |
| 004 | Système de réclamation des récompenses |
| 005 | Pseudo + leaderboard |
| 006 | Quiz liste (list_quizzes, list_quiz_sessions) |
| 007 | Système de classe virtuelle (classrooms, classroom_students) |
| 008 | Policies RLS classes |
| 009 | RPC increment_coins |
| 010 | Fix trigger handle_new_user |
| 011 | Lecture élèves par enseignant |
| 012 | Date de naissance + niveau scolaire |
| 013 | Refonte classe virtuelle |
| 014 | Colonne difficulté QCM |
| 015 | Boutique |
| 016 | Gamification complète (prestige, titres, badges, likes, leaderboard saisonnier, boosts) |
| 017 | Backfill leaderboard |
| 018 | Fix increment_coins_lifetime |
| 019 | Colonnes weekly_coins / monthly_coins / solde net |
| 020 | Colonne active_frame_id |
| 021 | SM-2 répétition espacée (colonnes flashcards + flashcard_reviews) |
