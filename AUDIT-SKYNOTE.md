# Audit Skynote — Rapport technique et copy-paste

Audit réalisé sur `components/marketing/LandingPage.tsx` (430 lignes) et `lib/i18n/translations.ts`.
Toutes les corrections sont prêtes à copier-coller. Pas de flou, pas de compliments.

---

## 1. Les vrais problèmes (analyse directe)

### 1.1 Responsive mobile — CRITIQUE

**Cause racine** : la page utilise **100% inline styles** et **zéro breakpoint**. Tailwind est installé mais pas utilisé dans la landing. Sur un iPhone SE (375px) ou un écran TikTok compressé, tout casse.

Problèmes concrets trouvés dans le code :

- **NavBar (l.177)** : `padding: "20px 24px"` fixe + 3 éléments (LanguagePicker + Connexion + CTA "Commencer gratuitement"). À 375px, le CTA passe à la ligne ou déborde. Le libellé français fait 22 caractères, il n'y a pas la place.
- **Hero stats (l.282)** : `gap: 48` sur 3 colonnes fixes. À 375px ça fait 3 blocs larges + 2×48px de gap = overflow horizontal garanti.
- **Hero h1 (l.260)** : `clamp(36px, 6vw, 64px)` → à 375px, 6vw = 22.5px, donc clamp min 36px s'applique. Bien. Mais la ligne `<br/>` force un saut qui laisse un orphelin sur mobile.
- **Features grid (l.312)** : `minmax(240px, 1fr)` → à 375px - 48px de padding = 327px, donc 1 colonne OK. Mais 240px min est trop serré : les cartes débordent.
- **Pricing grid (l.367)** : `minmax(220px, 1fr)` avec 3 cartes. Le badge "Populaire" (l.382) est en `position:absolute top:-12` et se fait couper par `overflow:hidden` des parents.
- **18/20 géant (l.270)** : `clamp(72px, 12vw, 120px)` — à 375px, 12vw = 45px, donc 72px min. OK. Mais combiné au `text-shadow` énorme il déborde latéralement.
- **NavBar Link `Connexion` (l.184)** : `padding: "8px 12px"` + `fontSize: 13`. Sur mobile, zone de tap < 44×44px → échec WCAG + UX tactile.
- **Aucun `overflow-x: hidden`** sur le body → scroll horizontal causé par les orbs (l.194-196) qui ont `top:-10%, left:-10%`.

### 1.2 Padding / spacing — incohérent

Valeurs trouvées dans le code (hardcodées, non systémiques) :

| Section | Padding | Problème |
|---|---|---|
| NavBar | `20px 24px` | OK desktop, trop à 375px |
| Hero | `64px 24px 80px` | OK |
| Problème | `40px 24px 60px` | Différent de hero sans raison |
| Features | `0 24px 80px` | Pas de padding-top |
| Testimonials | `0 24px 80px` | Idem |
| Pricing | `0 24px 80px` | Idem |
| Footer | `0 24px 40px` | Incohérent |

Pas de système. Il faut **3 espacements standards** : section (`py-20 md:py-28`), container (`px-5 md:px-6`), gap (`gap-4 md:gap-6`).

### 1.3 "Fait par IA" — la liste honnête

Ce qui trahit l'IA sur ta landing :

1. **Émojis dans les features** : 📸 ⚡ 🧠 💬 (l.18-21 + l.314-317). Aucune landing SaaS sérieuse (Notion, Linear, Framer, Superhuman) n'utilise d'émojis Unicode. C'est le marqueur #1.
2. **18/20 animé géant avec glow qui pulse toutes les 2s** (l.234, l.239, l.270). C'est le signe "ChatGPT landing page" par excellence.
3. **3 orbs colorés flottants + 20 étoiles qui scintillent** (l.194-199). Trop d'effets = pas pro.
4. **Gradient text animé "gradient-shift"** sur le titre (l.87-93). Trop vu.
5. **6 classes `fade-up-1` à `fade-up-6`** avec delays staggered. Effet "révélation dramatique" surfait.
6. **Copy agressive-motivationnelle** : "Tu perds rien à essayer. Tu perds du temps à ne pas le faire." "Ma prof a cru que j'avais révisé 3h." → tone "growth hacker 2019".
7. **"grâce aux fiches Skynote" dans les testimonials** → écriture à la ChatGPT.
8. **Pas d'éléments de preuve réels** : pas de logos d'écoles, pas de compteur d'utilisateurs vérifiable, pas de screenshots produit, pas de presse.

### 1.4 Fautes d'orthographe — LISTE EXHAUSTIVE

**Aucun accent** dans tout le `translations.ts` section FR (l.15-65). C'est l'erreur la plus visible pour un élève français. Liste complète à remplacer :

| Mot actuel | Doit être | Ligne |
|---|---|---|
| `15 secondes` | OK | 17 |
| `revision` | `révision` | 18, 19 |
| `revisent` | `révisent` | 19, 37 |
| `Creer` | `Créer` | 20, 42 |
| `generer` | `générer` | 22 |
| `reecrire` | `réécrire` | 23, 28 |
| `adapte` | `adapté` | 24 |
| `college & lycee` | `collège & lycée` | 24 |
| `probleme` | `problème` | 25, 26 ("Le probleme") |
| `recopier` | OK | 26 |
| `reviser` | `réviser` | 28 |
| `comprehension` | `compréhension` | 34 |
| `memoire` | `mémoire` | 34 |
| `connait` | `connaît` | 36 |
| `coeur` | `cœur` (ou `coeur` si pas de ligature) | 36 |
| `elles-memes` | `elles-mêmes` | 38 |
| `fonctionnalites` | `fonctionnalités` | 41 |
| `revises` | `révises` | 41 |
| `gratuitement` | OK | 42 |
| `evolue` | `évolue` | 45 |
| `illimites` | `illimités` | 54 |
| `Dictee` | `Dictée` | 55 |
| `Jusqu'a` | `Jusqu'à` | 59 |
| `Confidentialite` | `Confidentialité` | 63 |
| `legales` | `légales` | 64 |
| `Mentions legales` | `Mentions légales` | 64 |

Et dans `FALLBACK_TESTIMONIALS` (LandingPage.tsx l.31-33) :

| Actuel | Correction |
|---|---|
| `grace` | `grâce` |
| `revise` | `révisé` |
| `capte` | `capté` |
| `magique` | OK |

Et dans `FEATURES` hardcodé (l.18-21, inutilisé car i18n l'emporte mais à nettoyer) :
- `comprehension` → `compréhension`
- `memoire` → `mémoire`
- `connait` → `connaît`

### 1.5 Valeur pas claire vs ChatGPT

Ton hero actuel :
> « Tes cours. Tes fiches. En 15 secondes. Prends ton cours en photo, Skynote fait le reste. Fiches de révision, QCM, chatbot IA. »

Ce que l'élève comprend : « OK c'est ChatGPT qui fait des fiches. » Pas de différenciation.

Ce qui manque :
- Pourquoi pas ChatGPT ? (réponse : spécialisé programme scolaire français, QCM générés sur TON cours, pas de prompt à écrire, progress tracking, format fiches optimisé)
- Preuve visuelle (pas de screenshot du produit)
- Bénéfice concret chiffré au-delà de "15 secondes" (ex : "Révise en 20 min ce qui te prenait 2h")

### 1.6 Pas de démo visuelle

Zéro image produit sur la landing. Tu as `/public` mais que `skycoin.png`. C'est le 2e point bloquant après le responsive.

---

## 2. Corrections concrètes (code prêt-à-coller)

### 2.1 Activer Tailwind sur la landing + overflow-x global

Dans `app/globals.css`, ajouter en haut du `@layer base` :

```css
html, body { overflow-x: hidden; }
```

### 2.2 Système d'espacement — classes utilitaires

Ajouter dans `globals.css` sous `@layer components` :

```css
.section          { @apply py-16 md:py-24; }
.section-tight    { @apply py-12 md:py-16; }
.container-landing{ @apply mx-auto w-full max-w-[1100px] px-5 md:px-8; }
.eyebrow          { @apply text-[11px] font-bold uppercase tracking-[0.12em] text-brand-dark; }
```

Règle : chaque `<section>` reçoit `section` + un enfant avec `container-landing`. Plus jamais de padding custom inline.

### 2.3 NavBar responsive (remplacement complet)

```tsx
function NavBar({ t }: { t: (k: string) => string }) {
  return (
    <nav className="relative z-10">
      <div className="container-landing flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/skycoin.png" alt="Skynote" width={28} height={28} priority />
          <span className="text-[17px] font-bold tracking-tight text-[#F0F6FF]">Skynote</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguagePicker variant="landing" />
          <Link
            href="/login"
            className="hidden sm:inline-flex h-10 items-center px-3 text-[13px] font-medium text-slate-400 hover:text-white"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-[13px] font-semibold text-white shadow-btn transition hover:bg-brand-hover"
          >
            Essayer
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

Points clés :
- CTA court ("Essayer") pour tenir sur 375px
- Hauteur fixe 40px (`h-10`) pour tous les liens → zone tactile propre
- "Connexion" caché sous sm, on met un lien texte plus bas de la page
- Gap 4px mobile, 8px desktop

### 2.4 Hero réécrit — version SaaS sérieuse, avec démo produit

```tsx
<section className="relative z-10 section">
  <div className="container-landing max-w-[860px] text-center">

    {/* Badge crédibilité (plus subtil) */}
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 mb-8">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span className="text-[12px] text-slate-300">
        {isBeta ? "Beta ouverte · 100% gratuit" : "Disponible"}
      </span>
    </div>

    {/* H1 — bénéfice concret, pas slogan */}
    <h1 className="text-[34px] sm:text-5xl md:text-[56px] font-bold leading-[1.05] tracking-tight text-white">
      Révise 4× plus vite.<br className="hidden sm:block" />
      <span className="text-gradient-sky"> Sans réécrire un seul mot.</span>
    </h1>

    {/* Sous-titre — différenciation claire */}
    <p className="mt-5 mx-auto max-w-[560px] text-[15px] sm:text-[17px] leading-relaxed text-slate-400">
      Photographie ton cours. Skynote génère automatiquement ta fiche de révision,
      des QCM adaptés à <strong className="text-slate-200">ton niveau</strong> et
      un chatbot qui connaît <strong className="text-slate-200">ton cours</strong>.
      Pas un prompt à écrire.
    </p>

    {/* CTA principal + secondaire */}
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link
        href="/signup"
        className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-btn hover:bg-brand-hover"
      >
        {isBeta ? "Commencer gratuitement" : "Créer mon compte"}
      </Link>
      <a
        href="#demo"
        className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 text-[15px] font-medium text-slate-200 hover:bg-white/[0.05]"
      >
        Voir la démo ↓
      </a>
    </div>

    {/* Trust indicators sous le CTA — remplace les stats creuses */}
    <p className="mt-6 text-[12px] text-slate-500">
      Sans carte bancaire · Résiliable en 1 clic · Données hébergées en France
    </p>

    {/* DÉMO PRODUIT — avant/après */}
    <div id="demo" className="mt-16 sm:mt-20">
      <div className="relative mx-auto max-w-[980px] rounded-2xl border border-white/10 bg-[#0A1424] p-2 sm:p-3 shadow-2xl">
        {/* Barre "fenêtre" */}
        <div className="flex items-center gap-1.5 px-2 py-2">
          <span className="h-3 w-3 rounded-full bg-red-400/60" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
          <span className="h-3 w-3 rounded-full bg-green-400/60" />
        </div>
        {/* Contenu démo : 2 colonnes avant/après */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl overflow-hidden bg-black/40">
          {/* AVANT */}
          <div className="p-5 sm:p-6 bg-[#0D1B2E]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Ton cours (photo)
            </p>
            <Image
              src="/demo-cours.jpg"   // à créer: photo d'un cahier
              alt="Photo d'un cours scolaire"
              width={480}
              height={320}
              className="rounded-lg w-full h-auto"
            />
          </div>
          {/* APRÈS */}
          <div className="p-5 sm:p-6 bg-[#0D1B2E] text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-dark mb-3">
              Ta fiche Skynote · 15s plus tard
            </p>
            <div className="space-y-2 text-[13px] text-slate-300">
              <h4 className="text-white font-semibold">La Révolution française</h4>
              <p><span className="text-brand-dark">•</span> 1789 : prise de la Bastille</p>
              <p><span className="text-brand-dark">•</span> Abolition des privilèges (4 août)</p>
              <p><span className="text-brand-dark">•</span> Déclaration des Droits de l'Homme</p>
              <p className="pt-2 text-slate-500 text-[12px]">
                + 8 QCM générés sur ce chapitre
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>
```

**Ce qui change vs l'actuel** :
- Le hero ne promet plus un score fantaisiste ("18/20 moyenne"), il promet un **process** ("4× plus vite sans réécrire")
- Différenciation vs ChatGPT implicite : "pas un prompt à écrire" + "adapté à ton niveau" + "connaît ton cours"
- Démo produit visuelle intégrée direct dans le hero (plus besoin de scroller)
- 2 CTAs : signup + "voir démo" pour les sceptiques
- Trust row sous le CTA

### 2.5 Section "Pourquoi pas juste ChatGPT ?"

À insérer entre hero et features. C'est LA section qui convertit :

```tsx
<section className="relative z-10 section-tight">
  <div className="container-landing max-w-[900px]">
    <p className="eyebrow text-center mb-3">Et ChatGPT alors ?</p>
    <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight">
      ChatGPT est un couteau suisse.<br/>
      <span className="text-slate-400">Skynote est fait pour réviser.</span>
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* ChatGPT */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Avec ChatGPT
        </p>
        <ul className="space-y-3 text-[14px] text-slate-400">
          <li className="flex gap-3"><span className="text-slate-600">—</span>Tu écris un prompt à chaque cours</li>
          <li className="flex gap-3"><span className="text-slate-600">—</span>Le format des fiches change à chaque fois</li>
          <li className="flex gap-3"><span className="text-slate-600">—</span>Tu dois copier, coller, re-photographier</li>
          <li className="flex gap-3"><span className="text-slate-600">—</span>Aucun QCM automatique sur ton cours</li>
          <li className="flex gap-3"><span className="text-slate-600">—</span>Tu oublies tout dans 10 chats différents</li>
        </ul>
      </div>

      {/* Skynote */}
      <div className="rounded-2xl border border-brand/40 bg-brand/[0.05] p-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-dark mb-4">
          Avec Skynote
        </p>
        <ul className="space-y-3 text-[14px] text-slate-200">
          <li className="flex gap-3"><span className="text-brand-dark">✓</span>Tu prends une photo, c'est tout</li>
          <li className="flex gap-3"><span className="text-brand-dark">✓</span>Fiche au format programme scolaire FR</li>
          <li className="flex gap-3"><span className="text-brand-dark">✓</span>QCM généré automatiquement sur ce cours</li>
          <li className="flex gap-3"><span className="text-brand-dark">✓</span>Chatbot qui connaît ton cours par cœur</li>
          <li className="flex gap-3"><span className="text-brand-dark">✓</span>Tous tes cours organisés par matière</li>
        </ul>
      </div>
    </div>
  </div>
</section>
```

### 2.6 Features — sans émojis, icônes Lucide

Tu as déjà `lucide-react` installé. Remplace les 4 émojis par des icônes SVG propres :

```tsx
import { Camera, Zap, Brain, MessageSquare } from "lucide-react"

const FEATURES = [
  { Icon: Camera,         titleKey: 'landing.features.photo',   descKey: 'landing.features.photoDesc' },
  { Icon: Zap,            titleKey: 'landing.features.fiches',  descKey: 'landing.features.fichesDesc' },
  { Icon: Brain,          titleKey: 'landing.features.qcm',     descKey: 'landing.features.qcmDesc' },
  { Icon: MessageSquare,  titleKey: 'landing.features.chatbot', descKey: 'landing.features.chatbotDesc' },
]

// Render:
<section className="relative z-10 section">
  <div className="container-landing">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {FEATURES.map(({ Icon, titleKey, descKey }, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6 transition hover:border-white/20 hover:bg-white/[0.04]"
        >
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <h3 className="text-[15px] font-semibold text-white mb-1.5">{t(titleKey)}</h3>
          <p className="text-[13px] leading-relaxed text-slate-400">{t(descKey)}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### 2.7 Supprimer les animations "IA cheap"

Dans le bloc `CSS` (l.64-152) : **supprimer** ces animations :
- `gradient-shift` (utilisée sur `.sky-gradient-text`) — garder la classe mais sans animation
- `twinkle` + toutes les 20 étoiles (`STAR_POSITIONS`)
- `orb-drift` + les 3 orbs (ou garder 1 seul, plus subtil, `opacity: 0.06`)
- Le `sky-glow-pulse` qui clignote toutes les 2s sur le "18/20" → **supprimer complètement le bloc 18/20 du hero**, remplacé par la démo produit.

### 2.8 Testimonials — version crédible

Le problème : des testimonials inventés avec notes précises se détectent à 100m. Soit :

**Option A** — garder les vrais testimonials Supabase uniquement, masquer la section si < 3 vrais avis :

```tsx
{TESTIMONIALS.length >= 3 && (
  <section className="relative z-10 section">
    {/* ... */}
  </section>
)}
```

**Option B** — reformuler les fallback en langue d'élève réel + retirer les notes inventées :

```tsx
const FALLBACK_TESTIMONIALS = [
  { text: "Je photographie mon cours d'histoire le lundi, je révise direct sur Skynote avant le contrôle. Plus besoin de recopier.", name: "Inès, 3ᵉ", grade: "" },
  { text: "Les QCM me posent des questions sur des trucs que j'avais zappés en classe. C'est ce qui me manquait.", name: "Yanis, 2ⁿᵈᵉ", grade: "" },
  { text: "J'utilise le chatbot quand je comprends pas un paragraphe. Ça m'explique comme si c'était un prof perso.", name: "Léa, 4ᵉ", grade: "" },
]
```

Supprime la colonne `grade` → plus de scores "17/20" inventés.

---

## 3. Corrections i18n — patch exact

Remplacer **intégralement** les lignes 15-65 de `lib/i18n/translations.ts` (section FR) par :

```ts
'landing.hero.title1': 'Révise 4× plus vite.',
'landing.hero.title2': '',
'landing.hero.title3': 'Sans réécrire un mot.',
'landing.hero.subtitle': 'Photographie ton cours. Skynote génère ta fiche de révision, des QCM adaptés à ton niveau et un chatbot qui connaît ton cours. Pas un prompt à écrire.',
'landing.hero.avgGrade': '',
'landing.hero.cta': 'Créer mon compte',
'landing.hero.ctaBeta': 'Commencer gratuitement',
'landing.hero.ctaDemo': 'Voir la démo',
'landing.hero.trust': 'Sans carte bancaire · Résiliable en 1 clic · Données hébergées en France',

'landing.stats.fiches': 'pour générer tes fiches',
'landing.stats.faster': 'plus rapide que réécrire',
'landing.stats.adapted': 'adapté collège & lycée',

'landing.vs.label': 'Et ChatGPT alors ?',
'landing.vs.title1': 'ChatGPT est un couteau suisse.',
'landing.vs.title2': 'Skynote est fait pour réviser.',

'landing.problem.label': 'Le problème',
'landing.problem.title1': 'Tu passes 2h à recopier tes cours',
'landing.problem.title2': 'pour 15 min de vraie révision.',
'landing.problem.desc': 'Réécrire, ce n\'est pas réviser. Ton cerveau retient quand il est actif — pas quand il recopie. Skynote fait la mise en forme pour que tu te concentres sur l\'essentiel.',

'landing.features.photo': 'Photo, texte, vocal, PDF',
'landing.features.photoDesc': 'Importe ton cours comme tu veux. L\'IA s\'adapte.',
'landing.features.fiches': 'Fiches en 15 secondes',
'landing.features.fichesDesc': 'Pas en 15 minutes. En 15 secondes, chrono en main.',
'landing.features.qcm': 'QCM intelligents',
'landing.features.qcmDesc': 'Des questions qui testent ta compréhension, pas ta mémoire.',
'landing.features.chatbot': 'Chatbot par cours',
'landing.features.chatbotDesc': 'Pose tes questions. L\'IA connaît ton cours par cœur.',

'landing.testimonials.label': 'Ils révisent avec Skynote',
'landing.testimonials.title': 'Ce qu\'ils en disent.',

'landing.beta.label': 'Pendant la beta',
'landing.beta.title': 'Gratuit.',
'landing.beta.desc': 'Toutes les fonctionnalités. Aucune carte bancaire. Tu révises, tu progresses, c\'est tout.',
'landing.beta.cta': 'Créer mon compte gratuitement',

'landing.pricing.label': 'Nos forfaits',
'landing.pricing.title': 'Choisis ton plan',
'landing.pricing.subtitle': 'Commence gratuitement, évolue quand tu veux.',
'landing.pricing.free': 'Gratuit',
'landing.pricing.perMonth': '/mois',
'landing.pricing.yearly': 'en annuel',
'landing.pricing.popular': 'Populaire',
'landing.pricing.famille': 'Famille',
'landing.pricing.free1': '1 cours par semaine',
'landing.pricing.free2': 'Fiches IA + QCM',
'landing.pricing.free3': 'Sky Coins & objectifs',
'landing.pricing.plus1': 'Cours illimités',
'landing.pricing.plus2': 'Dictée vocale',
'landing.pricing.plus3': 'Chatbot IA par cours',
'landing.pricing.plus4': 'Tout le plan Gratuit',
'landing.pricing.fam1': 'Tout le plan Plus',
'landing.pricing.fam2': 'Jusqu\'à 6 enfants',
'landing.pricing.fam3': 'Dashboard parent',
'landing.pricing.fam4': 'Support prioritaire',

'landing.footer': 'Tu ne perds rien à essayer.',
'landing.footer.privacy': 'Confidentialité',
'landing.footer.terms': 'CGU',
'landing.footer.legal': 'Mentions légales',
```

---

## 4. Démo visuelle — 2 options rapides

**Option GIF (le plus efficace TikTok)** :
1. Enregistre ton écran pendant 8 secondes : photo du cours → fiche qui apparaît
2. Convertis avec [ezgif.com](https://ezgif.com) en GIF < 2 Mo
3. Place dans `/public/demo.gif`
4. Intègre :
```tsx
<Image
  src="/demo.gif"
  alt="Démo : d'un cours photographié à une fiche Skynote"
  width={980}
  height={540}
  unoptimized   // pour les GIF
  priority
  className="rounded-xl"
/>
```

**Option avant/après statique** (ce que j'ai codé en 2.4) : 2 colonnes côte-à-côte. Plus rapide à produire, aussi efficace. Tu photographies une page de cahier réelle → tu génères une fiche avec ton produit → tu screenshotes.

**Ce qu'il NE FAUT PAS faire** : une vidéo YouTube embed (lourd, bloque le LCP, tue ton SEO).

---

## 5. Ordre d'attaque recommandé (4h de dev)

1. **30 min** — patch i18n (tous les accents) + supprimer les émojis + icônes Lucide. *Gain : crédibilité immédiate.*
2. **45 min** — refactor NavBar + Hero en Tailwind responsive (code 2.3 + 2.4). *Gain : mobile réparé.*
3. **30 min** — produire le GIF ou les 2 screenshots avant/après. *Gain : compréhension produit.*
4. **45 min** — ajouter la section "vs ChatGPT" (code 2.5). *Gain : différenciation.*
5. **30 min** — refactor Features + Testimonials (code 2.6 + 2.8). *Gain : cohérence.*
6. **30 min** — nettoyer le CSS des animations "cheap" (2.7) + tester à 320/375/768/1024/1440. *Gain : sobriété.*
7. **10 min** — ajouter `overflow-x:hidden` + `.container-landing` + `.section`. *Gain : base saine.*

---

## 6. Checklist de vérification

- [ ] À 320px de large, aucun scroll horizontal
- [ ] À 375px, le CTA tient sur une ligne
- [ ] Zone de tap des boutons ≥ 44×44 px
- [ ] Zéro émoji Unicode dans le rendu final
- [ ] Zéro faute d'accent (Cmd+F "revision" dans translations.ts → 0 match)
- [ ] Une capture / GIF produit visible au-dessus du fold
- [ ] Section "vs ChatGPT" présente
- [ ] Pas d'animation qui clignote > 3s
- [ ] Lighthouse mobile : Perf > 85, LCP < 2.5s
- [ ] Open Graph image présente (`app/layout.tsx` metadata)

---

Audit terminé. Tout est actionnable. Les deux leviers avec le plus gros ROI : **fix accents i18n (30 min)** + **démo produit avant/après (30 min)**. Fais ces deux-là en premier, le reste peut attendre.
