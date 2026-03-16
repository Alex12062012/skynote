# 🌟 Skynote

Application SaaS éducative IA pour élèves de collège et lycée (10-17 ans).
Transforme tes cours en fiches de révision intelligentes et QCM grâce à l'IA.

## Stack

- **Next.js 14** App Router + TypeScript strict
- **Supabase** (Auth, PostgreSQL, Storage, Realtime)
- **Anthropic Claude** (génération fiches + QCM)
- **Tailwind CSS v3** — design system sky/night

## Démarrage rapide

```bash
npm install
cp .env.local.example .env.local
# Remplir les variables d'environnement
npm run dev
```

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Base de données Supabase

Exécuter dans l'ordre dans Supabase SQL Editor :
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_full_schema.sql`

## Parties

| # | Contenu | Status |
|---|---------|--------|
| 1 | Setup + Auth (Google + Email) | ✅ |
| 2 | BDD sécurisée + Design System | ✅ |
| 3 | Création cours + Upload | ✅ |
| 4 | IA — Fiches + QCM (Anthropic) | ✅ |
| 5 | **Sky Coins + Objectifs + Streak + Premium** | ✅ |
| 6 | Stripe + Brevo + Production | 🔜 |

## Nouvelles fonctionnalités Partie 5

- 🔥 **Streak de connexion** — mis à jour silencieusement à chaque visite
- 🎓 **Objectif maîtrise totale** — détecté automatiquement quand toutes les fiches sont maîtrisées
- ⭐ **Activation Premium avec coins** — modal de confirmation, 100 coins = 1 mois
- 💰 **Animations coins** — pluie de pièces + toast au score parfait
- 🏅 **Badge objectif complété** — notification animée en bas d'écran
- 📊 **Dashboard enrichi** — objectifs en cours, bannière progression Premium
- 👤 **Profil enrichi** — stats complètes, barre de progression coins
