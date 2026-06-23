/**
 * TABLES DE PROBABILITÉS DNB — Brevet standard (série générale)
 *
 * Construites à partir de l'analyse de 20+ années d'annales réelles :
 *   • Physique-Chimie  : 22 sessions (2017-2026) — source c-physique.fr
 *   • Histoire-Géo/EMC : ~20 sessions (tous sujets) — source monsieurdarras.fr
 *   • Maths            : 2017-2026, toutes zones — sources APMEP, BrevetIA, digischool
 *   • SVT              : 2017-2025 — sources ac-besancon, cours-et-fiches, recherche thématique
 *   • Français         : structure fixe (programme officiel DNB)
 *
 * Usage :
 *   import { drawBrevetSession } from '@/lib/brevet/proba-tables'
 *   const session = drawBrevetSession()
 *   // → { maths: ChapterDraw[], francais: ChapterDraw[], ... }
 *   // Passer session à Claude pour générer les questions
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Chapter {
  id: string
  label: string               // Nom affiché à l'élève
  probability: number         // 0-1 : probabilité d'apparition dans un sujet donné
  points: number              // Points typiques dans l'épreuve
  /** Description interne (pour le prompt Claude) — non montrée à l'élève */
  promptContext: string
  /** Exemples de types de questions qui tombent sur ce chapitre */
  questionTypes: string[]
}

export interface SubjectConfig {
  subject: 'maths' | 'francais' | 'histoire_geo' | 'svt' | 'physique_chimie'
  label: string
  duration: string            // durée de l'épreuve réelle
  totalPoints: number
  structure: string           // description de la structure réelle de l'épreuve
  /** Nombre d'exercices/blocs à sélectionner dans la simulation */
  exercisesToDraw: number
  chapters: Chapter[]
}

export interface ChapterDraw {
  chapter: Chapter
  subject: SubjectConfig['subject']
}

export interface BrevetSession {
  maths: ChapterDraw[]
  francais: ChapterDraw[]
  histoire_geo: ChapterDraw[]
  svt: ChapterDraw[]
  physique_chimie: ChapterDraw[]
}

// ─── MATHÉMATIQUES ────────────────────────────────────────────────────────────
// Format 2017-2025 : QCM 13pts + Exercices 40pts + Problème 47pts (2h, 100pts)
// Format 2026 : Automatismes 6pts + Exercices (nouveau format, coeff 2)
// Analyse : presque TOUTES les sessions incluent calcul/algèbre + géométrie.
// Probabilités calculées sur ~40 sujets métropole + centres étrangers 2017-2025.

export const MATHS: SubjectConfig = {
  subject: 'maths',
  label: 'Mathématiques',
  duration: '2h',
  totalPoints: 100,
  structure: 'QCM (13pts) + Exercices indépendants (40pts) + Problème (47pts). Rédaction et clarté rapportent 2pts supplémentaires.',
  exercisesToDraw: 4,
  chapters: [
    {
      id: 'calcul_algebre',
      label: 'Calcul et algèbre',
      probability: 0.95,
      points: 15,
      promptContext: 'Développement, factorisation, équations du 1er degré, calcul numérique (fractions, puissances, racines carrées), calcul littéral.',
      questionTypes: [
        'Résoudre une équation du 1er degré',
        'Développer et réduire une expression',
        'Factoriser une expression',
        'Résoudre un problème par mise en équation',
        'Calculer avec des puissances ou des fractions',
      ],
    },
    {
      id: 'geometrie_pythagore_thales',
      label: 'Géométrie : Pythagore & Thalès',
      probability: 0.92,
      points: 20,
      promptContext: 'Théorème de Pythagore (direct et réciproque), théorème de Thalès (calcul de longueur, parallélisme), démo géométrique, configuration classique triangle rectangle ou sécantes.',
      questionTypes: [
        'Calculer la longueur d\'un côté avec Pythagore',
        'Vérifier si un triangle est rectangle',
        'Calculer une longueur avec Thalès',
        'Démontrer que deux droites sont parallèles',
        'Résoudre un problème de géométrie en plusieurs étapes',
      ],
    },
    {
      id: 'fonctions',
      label: 'Fonctions',
      probability: 0.87,
      points: 15,
      promptContext: 'Fonctions affines (f(x)=ax+b), fonctions linéaires, lecture graphique, tableau de valeurs, taux de variation, lecture d\'image et d\'antécédent.',
      questionTypes: [
        'Lire l\'image ou l\'antécédent sur un graphique',
        'Dresser un tableau de valeurs',
        'Exprimer une fonction affine à partir d\'un contexte',
        'Comparer deux fonctions affines graphiquement',
        'Calculer le coefficient directeur',
      ],
    },
    {
      id: 'stats_probabilites',
      label: 'Statistiques & Probabilités',
      probability: 0.88,
      points: 12,
      promptContext: 'Moyenne, médiane, étendue, quartiles, diagramme en boîte, probabilités (événements, fréquences, arbre de probabilités), loi des grands nombres.',
      questionTypes: [
        'Calculer la moyenne et la médiane d\'une série',
        'Lire un diagramme en boîte (quartiles)',
        'Calculer une probabilité par arbre',
        'Calculer une fréquence cumulée',
        'Interpréter un tableau de données statistiques',
      ],
    },
    {
      id: 'trigonometrie',
      label: 'Trigonométrie',
      probability: 0.72,
      points: 10,
      promptContext: 'Cosinus, sinus, tangente d\'un angle aigu dans un triangle rectangle. Calcul d\'un angle ou d\'une longueur. Souvent intégré dans le problème principal.',
      questionTypes: [
        'Calculer un angle à partir de sin/cos/tan',
        'Calculer une longueur dans un triangle rectangle',
        'Appliquer sin/cos/tan dans un contexte réel (pente, hauteur)',
        'Combiner Pythagore et trigonométrie',
      ],
    },
    {
      id: 'aires_volumes',
      label: 'Aires, volumes & périmètres',
      probability: 0.67,
      points: 10,
      promptContext: 'Calcul d\'aire (triangle, cercle, trapèze, figures composées), volume (prisme, cylindre, pyramide, cône, sphère), périmètre. Souvent couplé à un problème contextuel.',
      questionTypes: [
        'Calculer l\'aire d\'une figure composée',
        'Calculer le volume d\'un solide',
        'Comparer deux volumes',
        'Résoudre un problème d\'optimisation sur des aires',
      ],
    },
    {
      id: 'arithmetique',
      label: 'Arithmétique',
      probability: 0.55,
      points: 8,
      promptContext: 'PGCD, PPCM, décomposition en facteurs premiers, fractions irréductibles, divisibilité, nombres premiers.',
      questionTypes: [
        'Décomposer un nombre en facteurs premiers',
        'Calculer le PGCD de deux entiers',
        'Simplifier une fraction',
        'Résoudre un problème de partage / répartition égale',
      ],
    },
    {
      id: 'pourcentages_evolution',
      label: 'Pourcentages & taux d\'évolution',
      probability: 0.52,
      points: 8,
      promptContext: 'Calcul de pourcentage, taux d\'évolution (hausse/baisse), taux réciproque, évolutions successives. Souvent dans un contexte concret (soldes, prix, population).',
      questionTypes: [
        'Calculer un pourcentage d\'une valeur',
        'Calculer un taux d\'évolution',
        'Appliquer deux évolutions successives',
        'Trouver le taux réciproque',
      ],
    },
    {
      id: 'geometrie_espace',
      label: 'Géométrie dans l\'espace',
      probability: 0.45,
      points: 8,
      promptContext: 'Sections de solides (plan de coupe), représentation en perspective, patron de solide, calcul sur des polyèdres.',
      questionTypes: [
        'Identifier la section d\'un solide par un plan',
        'Construire ou compléter un patron',
        'Reconnaître un solide depuis sa représentation',
      ],
    },
    {
      id: 'proportionnalite',
      label: 'Proportionnalité',
      probability: 0.42,
      points: 8,
      promptContext: 'Tableaux de proportionnalité, 4e proportionnelle, règle de trois, grandeurs proportionnelles, coefficient de proportionnalité.',
      questionTypes: [
        'Compléter un tableau de proportionnalité',
        'Résoudre un problème de 4e proportionnelle',
        'Vérifier si deux grandeurs sont proportionnelles',
      ],
    },
    {
      id: 'transformations',
      label: 'Transformations géométriques',
      probability: 0.32,
      points: 8,
      promptContext: 'Symétrie axiale et centrale, translation, rotation, homothétie. Souvent en fin d\'exercice ou en lien avec des propriétés.',
      questionTypes: [
        'Construire l\'image d\'une figure par une symétrie',
        'Déterminer le centre de symétrie',
        'Appliquer une translation ou rotation',
      ],
    },
    {
      id: 'algorithmique',
      label: 'Algorithmique',
      probability: 0.22,
      points: 6,
      promptContext: 'Lecture et écriture d\'algorithmes simples (Scratch ou pseudo-code), boucles, conditions, variables. Souvent 1 question intégrée dans un exercice.',
      questionTypes: [
        'Lire un algorithme et donner son résultat',
        'Compléter un algorithme',
        'Écrire un algorithme simple',
      ],
    },
  ],
}

// ─── FRANÇAIS ─────────────────────────────────────────────────────────────────
// Structure FIXE : Compréhension (40pts) + Langue (20pts) + Rédaction (40pts)
// Durée : 3h. Le texte support varie mais les compétences testées sont constantes.
// Le "tirage" porte sur : genre du texte support + type de rédaction demandée.

export const FRANCAIS: SubjectConfig = {
  subject: 'francais',
  label: 'Français',
  duration: '3h',
  totalPoints: 100,
  structure: 'Compréhension & analyse du texte (40pts) + Grammaire/langue (20pts) + Rédaction (40pts — 2 sujets au choix : narratif ou argumentatif).',
  exercisesToDraw: 3,
  chapters: [
    {
      id: 'comprehension_roman_nouvelle',
      label: 'Texte : roman / nouvelle',
      probability: 0.52,
      points: 40,
      promptContext: 'Texte support : extrait de roman ou nouvelle (XIXe-XXIe s.). Questions de compréhension : repérage d\'informations, analyse de personnage, figures de style, point de vue narratif, registre.',
      questionTypes: [
        'Identifier le narrateur et le point de vue',
        'Analyser un personnage (portrait, évolution)',
        'Repérer et expliquer une figure de style',
        'Résumer les informations principales',
        'Interpréter le sens d\'un passage',
      ],
    },
    {
      id: 'comprehension_texte_idees',
      label: 'Texte : texte d\'idées / essai',
      probability: 0.28,
      points: 40,
      promptContext: 'Texte support : article de presse, essai, texte argumentatif. Questions : thèse, arguments, exemples, concession, vocabulaire, organisation.',
      questionTypes: [
        'Identifier la thèse et les arguments',
        'Analyser la structure argumentative',
        'Expliquer un mot ou une expression',
        'Distinguer fait et opinion',
        'Évaluer la pertinence d\'un argument',
      ],
    },
    {
      id: 'comprehension_poesie_theatre',
      label: 'Texte : poésie / théâtre',
      probability: 0.20,
      points: 40,
      promptContext: 'Texte support : poème (classique ou moderne) ou extrait de pièce de théâtre. Questions sur les procédés poétiques ou dramatiques, émotions, mise en scène.',
      questionTypes: [
        'Identifier les rimes et le rythme (poésie)',
        'Analyser les images poétiques',
        'Repérer les didascalies et leur rôle (théâtre)',
        'Interpréter le sens symbolique',
      ],
    },
    {
      id: 'langue_grammaire',
      label: 'Grammaire & langue',
      probability: 1.0,
      points: 20,
      promptContext: 'Questions de langue sur le texte support : nature et fonction des mots, propositions subordonnées, temps verbaux (imparfait/passé simple/conditionnel), accord des participes, ponctuation.',
      questionTypes: [
        'Identifier la nature d\'un groupe nominal',
        'Analyser une proposition subordonnée relative ou conjonctive',
        'Conjuguer un verbe à un temps demandé',
        'Justifier un accord (participe passé, adjectif)',
        'Repérer le mode d\'un verbe et expliquer son emploi',
      ],
    },
    {
      id: 'redaction_narrative',
      label: 'Rédaction : texte narratif',
      probability: 0.85,
      points: 40,
      promptContext: 'Sujet de rédaction narratif : écrire une suite de texte, imaginer une scène, raconter un événement. Évalué sur : richesse du récit, cohérence narrative, qualité de la langue.',
      questionTypes: [
        'Écrire la suite du texte en respectant le ton',
        'Imaginer un dialogue entre personnages',
        'Raconter un souvenir marquant',
        'Inventer une fin alternative',
      ],
    },
    {
      id: 'redaction_argumentative',
      label: 'Rédaction : texte argumentatif',
      probability: 0.85,
      points: 40,
      promptContext: 'Sujet de rédaction argumentatif : défendre ou réfuter une thèse, donner son avis avec arguments et exemples. Structure : thèse + 2-3 arguments + conclusion.',
      questionTypes: [
        'Défendre un point de vue avec 3 arguments',
        'Réfuter une affirmation',
        'Donner son avis sur une question de société',
        'Écrire un texte pour convaincre',
      ],
    },
  ],
}

// ─── HISTOIRE-GÉOGRAPHIE / EMC ────────────────────────────────────────────────
// Structure : Analyse de documents Histoire ou Géo (20pts) +
//             Développement construit Histoire ou Géo (20pts) +
//             Carte / Croquis géographique (10pts) +
//             Question EMC courte (10pts)
// Durée : 2h.
//
// Probabilités basées sur les statistiques réelles de monsieurdarras.fr
// (~20 sujets métropole + centres étrangers compilés).

export const HISTOIRE_GEO: SubjectConfig = {
  subject: 'histoire_geo',
  label: 'Histoire-Géographie & EMC',
  duration: '2h',
  totalPoints: 60,
  structure: 'Analyse de documents (20pts) + Développement construit (20pts) + Carte géographique (10pts) + EMC (10pts).',
  exercisesToDraw: 3,
  chapters: [
    // ── HISTOIRE — chapitres ──────────────────────────────────────────────────
    {
      id: 'hist_ww1',
      label: 'Hist. — Première Guerre mondiale',
      probability: 0.28,
      points: 20,
      promptContext: 'Première Guerre mondiale (1914-1918) : causes, déroulement, soldats (conditions de vie, batailles emblématiques), innovations militaires, bilan humain et géopolitique. Peut être en Analyse de documents ou Développement construit.',
      questionTypes: [
        'Analyser un document sur les conditions de vie dans les tranchées',
        'Décrire les grandes batailles (Verdun, Somme)',
        'Expliquer les innovations militaires (gaz, tanks, aviation)',
        'Faire un développement construit sur la brutalisation des sociétés',
      ],
    },
    {
      id: 'hist_entre_deux_guerres',
      label: 'Hist. — Entre-deux-guerres',
      probability: 0.24,
      points: 20,
      promptContext: 'Entre-deux-guerres (1919-1939) : traité de Versailles, crise de 1929, montée des totalitarismes (nazisme, fascisme, stalinisme), Front populaire, politique des démocraties.',
      questionTypes: [
        'Analyser la montée du nazisme en Allemagne',
        'Expliquer les causes et effets de la crise de 1929',
        'Décrire le régime totalitaire soviétique ou fasciste',
        'Faire un DC sur les fragilités de la paix après 1918',
      ],
    },
    {
      id: 'hist_vichy',
      label: 'Hist. — France de Vichy & Résistance',
      probability: 0.19,
      points: 20,
      promptContext: 'France de Vichy (1940-1944) : armistice, régime de Vichy (collaboration, antisémitisme, Révolution nationale), Résistance intérieure et extérieure (de Gaulle, Jean Moulin), Libération.',
      questionTypes: [
        'Analyser un document sur la collaboration ou la Résistance',
        'Expliquer le régime de Vichy et la politique d\'exclusion',
        'Décrire le rôle de Jean Moulin ou de de Gaulle',
        'Faire un DC sur les Français face à l\'Occupation',
      ],
    },
    {
      id: 'hist_decolonisation',
      label: 'Hist. — Décolonisation & indépendances',
      probability: 0.14,
      points: 20,
      promptContext: 'Décolonisation (années 1950-1970) : causes, processus (négocié ou violent), guerre d\'Algérie, cas de l\'Inde ou de l\'Afrique sub-saharienne, rôle de l\'ONU.',
      questionTypes: [
        'Analyser un discours d\'indépendance',
        'Expliquer les causes et formes de la décolonisation',
        'Décrire la guerre d\'Algérie et ses conséquences',
        'Faire un DC sur les indépendances africaines',
      ],
    },
    {
      id: 'hist_guerre_froide',
      label: 'Hist. — Guerre froide',
      probability: 0.10,
      points: 20,
      promptContext: 'Guerre froide (1947-1991) : opposition USA/URSS, blocs, crises (Berlin, Cuba), course aux armements, espace, décolonisation dans le contexte bipolaire, chute du mur.',
      questionTypes: [
        'Analyser une affiche de propagande de Guerre froide',
        'Expliquer la crise de Cuba ou de Berlin',
        'Décrire le bloc soviétique ou le modèle américain',
        'Faire un DC sur les tensions et crises de la Guerre froide',
      ],
    },
    {
      id: 'hist_ww2',
      label: 'Hist. — Deuxième Guerre mondiale',
      probability: 0.08,
      points: 20,
      promptContext: 'Seconde Guerre mondiale (1939-1945) : déroulement, guerre totale, crime de masse et Shoah, tournants (Stalingrad, Débarquement), bilan.',
      questionTypes: [
        'Analyser un document sur la Shoah ou les crimes de guerre',
        'Expliquer le caractère total de la WWII',
        'Décrire le Débarquement ou Stalingrad',
        'Faire un DC sur la guerre d\'anéantissement',
      ],
    },
    {
      id: 'hist_france_1950_1980',
      label: 'Hist. — France des 30 Glorieuses',
      probability: 0.07,
      points: 20,
      promptContext: 'France des années 1950 aux années 1980 : Trente Glorieuses (croissance, exode rural, société de consommation), Mai 68, choc pétrolier, transformation de la société.',
      questionTypes: [
        'Décrire les mutations économiques et sociales des 30 Glorieuses',
        'Analyser un document sur Mai 68',
        'Expliquer l\'essor de la société de consommation',
      ],
    },
    // ── GÉOGRAPHIE — chapitres ───────────────────────────────────────────────
    {
      id: 'geo_territoires_ultramarins',
      label: 'Géo — Territoires ultramarins français',
      probability: 0.22,
      points: 20,
      promptContext: 'DOM-ROM-COM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, Polynésie…) : localisation, diversité, atouts et contraintes, liens avec la métropole, développement.',
      questionTypes: [
        'Localiser et caractériser les territoires ultramarins',
        'Analyser les atouts et contraintes d\'un DOM/ROM',
        'Expliquer les liens économiques avec la métropole',
        'Faire un croquis des territoires ultramarins',
      ],
    },
    {
      id: 'geo_aires_urbaines',
      label: 'Géo — Aires urbaines & métropolisation',
      probability: 0.19,
      points: 20,
      promptContext: 'Métropolisation en France : aires urbaines (centre/périphérie), croissance des métropoles régionales, périurbanisation, gentrification, inégalités urbain/rural.',
      questionTypes: [
        'Analyser un document sur la croissance urbaine',
        'Expliquer la périurbanisation',
        'Décrire les inégalités au sein d\'une aire urbaine',
        'Faire un croquis d\'organisation d\'une aire urbaine',
      ],
    },
    {
      id: 'geo_espaces_productifs',
      label: 'Géo — Espaces productifs',
      probability: 0.19,
      points: 20,
      promptContext: 'Espaces industriels, agricoles et tertiaires en France : localisation, mutations (désindustrialisation, tertiarisation), mondialisation, tourisme, agriculture intensive.',
      questionTypes: [
        'Analyser un espace industriel ou agricole',
        'Expliquer la mutation d\'un espace productif',
        'Décrire les liens entre mondialisation et espaces productifs',
        'Faire un croquis d\'un espace industriel',
      ],
    },
    {
      id: 'geo_france_europe_monde',
      label: 'Géo — France & Europe dans le monde',
      probability: 0.17,
      points: 20,
      promptContext: 'Place de la France et de l\'Union Européenne dans la mondialisation : pôles, flux (commerciaux, migratoires, touristiques), puissance économique, rayonnement culturel.',
      questionTypes: [
        'Analyser la place de la France dans la mondialisation',
        'Expliquer le rôle de l\'UE comme pôle économique mondial',
        'Décrire les flux économiques ou migratoires',
        'Faire un croquis de la France dans l\'espace mondial',
      ],
    },
    {
      id: 'geo_faibles_densites',
      label: 'Géo — Espaces à faibles densités',
      probability: 0.15,
      points: 20,
      promptContext: 'Espaces ruraux, de montagne et touristiques en France : désertification rurale, recompositions (résidences secondaires, tourisme vert, néo-ruraux), politiques d\'aménagement.',
      questionTypes: [
        'Analyser un espace rural en mutation',
        'Expliquer les causes et effets de la désertification rurale',
        'Décrire les atouts d\'un espace de montagne ou littoral',
        'Faire un croquis d\'espace à faible densité',
      ],
    },
    {
      id: 'geo_amenagement',
      label: 'Géo — Aménager les territoires',
      probability: 0.11,
      points: 20,
      promptContext: 'Politiques d\'aménagement du territoire en France et en Europe : SNCF, autoroutes, ZAC, politiques régionales UE (fonds structurels), réduction des inégalités territoriales.',
      questionTypes: [
        'Analyser un projet d\'aménagement territorial',
        'Expliquer les enjeux des politiques régionales européennes',
        'Décrire l\'impact d\'un grand équipement sur un territoire',
      ],
    },
    // ── EMC ──────────────────────────────────────────────────────────────────
    {
      id: 'emc_egalite',
      label: 'EMC — Égalité (femmes-hommes, droits)',
      probability: 0.30,
      points: 10,
      promptContext: 'Égalité entre femmes et hommes, droits civiques, discriminations, laïcité, République et ses valeurs. Question courte sur un document ou une situation.',
      questionTypes: [
        'Expliquer le principe d\'égalité entre femmes et hommes',
        'Analyser une situation de discrimination',
        'Définir la laïcité et ses applications',
        'Expliquer les droits fondamentaux du citoyen',
      ],
    },
    {
      id: 'emc_democratie_citoyennete',
      label: 'EMC — Démocratie & citoyenneté',
      probability: 0.25,
      points: 10,
      promptContext: 'Fonctionnement de la démocratie, institutions de la Ve République, participation citoyenne (vote, associations, pétitions), droits et devoirs du citoyen.',
      questionTypes: [
        'Expliquer le rôle du Parlement ou du Président',
        'Décrire différentes formes de participation citoyenne',
        'Analyser un texte sur la démocratie représentative',
        'Expliquer les droits et devoirs liés à la nationalité',
      ],
    },
    {
      id: 'emc_numerique_societe',
      label: 'EMC — Numérique & société',
      probability: 0.20,
      points: 10,
      promptContext: 'Enjeux du numérique : libertés en ligne, données personnelles (RGPD), cyberharcèlement, fake news, responsabilité sur les réseaux sociaux.',
      questionTypes: [
        'Expliquer les risques liés à la vie privée en ligne',
        'Analyser un cas de cyberharcèlement',
        'Décrire les règles d\'utilisation des réseaux sociaux',
        'Expliquer ce qu\'est le RGPD',
      ],
    },
    {
      id: 'emc_securite_defense',
      label: 'EMC — Sécurité & défense nationale',
      probability: 0.15,
      points: 10,
      promptContext: 'Défense nationale, armée, missions de sécurité (police, gendarmerie, SDIS), solidarité internationale (OPEX), service national universel.',
      questionTypes: [
        'Expliquer le rôle des forces armées françaises',
        'Décrire une mission de maintien de la paix (OPEX)',
        'Expliquer le SNU et la JDC',
        'Analyser un cas de coopération internationale pour la sécurité',
      ],
    },
    {
      id: 'emc_environnement',
      label: 'EMC — Environnement & développement durable',
      probability: 0.10,
      points: 10,
      promptContext: 'Enjeux environnementaux : changement climatique, biodiversité, développement durable, responsabilité individuelle et collective, accords internationaux (COP).',
      questionTypes: [
        'Analyser les causes du changement climatique',
        'Décrire des actions en faveur du développement durable',
        'Expliquer la responsabilité des États et des citoyens',
      ],
    },
  ],
}

// ─── SVT ─────────────────────────────────────────────────────────────────────
// Structure : épreuve partagée avec Physique-Chimie (1h30 total).
// SVT occupe environ 45 min, avec 2 exercices indépendants.
// Probabilités basées sur ac-besancon (58 sujets), cours-et-fiches.com,
// inesmaths.fr et connaissances des programmes cycle 4.

export const SVT: SubjectConfig = {
  subject: 'svt',
  label: 'SVT',
  duration: '45 min (dans l\'épreuve Sciences)',
  totalPoints: 50,
  structure: 'Deux exercices SVT indépendants (environ 25pts chacun). Analyse de documents, exploitation de données, démarche scientifique.',
  exercisesToDraw: 2,
  chapters: [
    {
      id: 'svt_corps_sante',
      label: 'Corps humain & santé',
      probability: 0.75,
      points: 25,
      promptContext: 'Appareil digestif (digestion, enzymes, absorption), système nerveux (réflexe, sens), système immunitaire (défenses, vaccins), appareil respiratoire, système cardio-vasculaire, reproduction.',
      questionTypes: [
        'Analyser un schéma de l\'appareil digestif',
        'Expliquer le rôle des enzymes digestives',
        'Décrire la réaction inflammatoire ou la réponse immunitaire',
        'Expliquer le principe de la vaccination',
        'Analyser un électrocardiogramme ou un schéma du cœur',
      ],
    },
    {
      id: 'svt_genetique',
      label: 'Génétique & hérédité',
      probability: 0.70,
      points: 25,
      promptContext: 'ADN, gènes, allèles, chromosomes, caryotype, transmission des caractères (monohybridisme, dominance/récessivité), groupes sanguins, mutation génétique, méiose et fécondation.',
      questionTypes: [
        'Lire un arbre généalogique et déterminer les génotypes',
        'Expliquer la transmission d\'un caractère héréditaire',
        'Analyser un caryotype',
        'Expliquer le rôle de l\'ADN dans l\'hérédité',
        'Calculer les probabilités d\'une descendance (tableau de croisement)',
      ],
    },
    {
      id: 'svt_evolution',
      label: 'Évolution & biodiversité',
      probability: 0.60,
      points: 25,
      promptContext: 'Sélection naturelle, mutation et variation, classification du vivant (arbres phylogénétiques), adaptation, parenté des êtres vivants, histoire de la vie sur Terre.',
      questionTypes: [
        'Analyser un arbre phylogénétique',
        'Expliquer la sélection naturelle sur un exemple',
        'Interpréter un document sur des fossiles',
        'Montrer la parenté entre espèces à partir d\'analogies',
        'Expliquer l\'origine d\'une adaptation à l\'environnement',
      ],
    },
    {
      id: 'svt_ecosystemes',
      label: 'Écosystèmes & environnement',
      probability: 0.52,
      points: 25,
      promptContext: 'Chaînes et réseaux alimentaires, flux de matière et d\'énergie, biodiversité, impact de l\'Homme (pollution, déforestation, espèces invasives), développement durable, cycle du carbone.',
      questionTypes: [
        'Construire ou analyser un réseau alimentaire',
        'Expliquer l\'impact d\'une perturbation sur un écosystème',
        'Analyser des données sur la biodiversité',
        'Expliquer le cycle du carbone',
        'Proposer des solutions pour préserver un écosystème',
      ],
    },
    {
      id: 'svt_geologie',
      label: 'Géologie — Terre dynamique',
      probability: 0.38,
      points: 25,
      promptContext: 'Structure interne de la Terre, tectonique des plaques (dérive des continents, séismes, volcans), risques naturels géologiques, roches et minéraux, âge de la Terre.',
      questionTypes: [
        'Analyser un document sur les séismes ou les volcans',
        'Expliquer la théorie de la tectonique des plaques',
        'Interpréter une carte géologique simple',
        'Décrire la structure interne de la Terre',
        'Relier phénomène géologique et zone de subduction ou rift',
      ],
    },
    {
      id: 'svt_reproduction',
      label: 'Reproduction & développement',
      probability: 0.28,
      points: 25,
      promptContext: 'Reproduction sexuée et asexuée, fécondation, développement embryonnaire, puberté, contraception, cycle menstruel, parenté entre cellules reproductrices.',
      questionTypes: [
        'Expliquer les étapes de la reproduction sexuée',
        'Analyser un schéma du cycle menstruel',
        'Expliquer le principe de la contraception',
        'Décrire les transformations de la puberté',
      ],
    },
    {
      id: 'svt_nutrition_plantes',
      label: 'Nutrition des plantes & photosynthèse',
      probability: 0.25,
      points: 25,
      promptContext: 'Photosynthèse (réactifs, produits, rôle de la lumière et de la chlorophylle), respiration cellulaire, nutrition minérale des plantes, relations plante-sol.',
      questionTypes: [
        'Écrire et expliquer l\'équation de la photosynthèse',
        'Analyser une expérience sur la photosynthèse',
        'Comparer photosynthèse et respiration cellulaire',
        'Expliquer l\'absorption de l\'eau et des sels minéraux',
      ],
    },
  ],
}

// ─── PHYSIQUE-CHIMIE ─────────────────────────────────────────────────────────
// Structure : épreuve partagée avec SVT (1h30 total).
// PC occupe environ 45 min, avec 2-3 exercices.
// Probabilités calculées sur 22 sessions officielles (2017-2026) — c-physique.fr.
//
// Observation majeure : la Chimie (atomes/molécules/transformation) tombe dans
// ~95% des sessions. La Mécanique (mouvement/énergie) dans ~75%.
// L'Électricité dans ~35%. Les Signaux (optique/son/radar) dans ~15%.

export const PHYSIQUE_CHIMIE: SubjectConfig = {
  subject: 'physique_chimie',
  label: 'Physique-Chimie',
  duration: '45 min (dans l\'épreuve Sciences)',
  totalPoints: 50,
  structure: '2-3 exercices indépendants couvrant chimie + 1-2 autres domaines (mécanique, électricité, signaux).',
  exercisesToDraw: 2,
  chapters: [
    {
      id: 'pc_chimie_atomes',
      label: 'Chimie — Atomes, molécules & transformations',
      probability: 0.94,
      points: 20,
      promptContext: 'Modèle atomique (protons, neutrons, électrons), ions, molécules, formules chimiques, transformation chimique (réactifs/produits, conservation de la masse, équation bilan), masse volumique, mélanges et corps purs, identification d\'ions (tests).',
      questionTypes: [
        'Écrire et équilibrer une équation chimique',
        'Calculer la masse d\'un réactif ou produit',
        'Identifier un ion à partir d\'un test (flamme, précipité)',
        'Calculer la masse volumique d\'un corps',
        'Distinguer corps pur et mélange',
        'Expliquer la conservation de la masse',
      ],
    },
    {
      id: 'pc_mecanique',
      label: 'Mécanique — Mouvement, forces & énergie',
      probability: 0.76,
      points: 20,
      promptContext: 'Mouvement (vitesse, trajectoire, référentiel), forces (représentation, poids, réaction normale), énergie (cinétique, potentielle, mécanique, conversion), gravitation universelle, principe d\'inertie.',
      questionTypes: [
        'Calculer une vitesse moyenne',
        'Représenter et nommer les forces qui s\'exercent sur un objet',
        'Calculer l\'énergie cinétique',
        'Expliquer une conversion d\'énergie',
        'Appliquer la loi de la gravitation (poids vs masse)',
        'Analyser un graphique de mouvement',
      ],
    },
    {
      id: 'pc_electricite',
      label: 'Électricité — Circuits & énergie',
      probability: 0.36,
      points: 20,
      promptContext: 'Circuit électrique (série, dérivation), intensité (ampèremètre, loi des nœuds), tension (voltmètre, loi des mailles), résistance (loi d\'Ohm), puissance et énergie électriques.',
      questionTypes: [
        'Calculer l\'intensité dans un circuit en dérivation',
        'Appliquer la loi d\'Ohm',
        'Calculer la puissance ou l\'énergie consommée',
        'Lire un schéma de circuit électrique',
        'Appliquer la loi des mailles pour calculer une tension',
      ],
    },
    {
      id: 'pc_signaux',
      label: 'Signaux — Optique, son, radar',
      probability: 0.17,
      points: 20,
      promptContext: 'Lumière (propagation rectiligne, vitesse, radar, principe du LIDAR/RADAR), signaux sonores (fréquence, hauteur, timbre, vitesse du son), signaux électromagnétiques.',
      questionTypes: [
        'Calculer une distance à l\'aide du principe du radar',
        'Calculer la vitesse du son',
        'Distinguer fréquence, hauteur et timbre d\'un son',
        'Expliquer la propagation de la lumière',
        'Analyser un signal sonore sur oscilloscope',
      ],
    },
    {
      id: 'pc_ph_acido_basique',
      label: 'Chimie — pH & réactions acido-basiques',
      probability: 0.22,
      points: 15,
      promptContext: 'Échelle de pH (acide/basique/neutre), mesure du pH (indicateurs colorés, pH-mètre), réaction acide-métal (dégagement d\'hydrogène), neutralisation.',
      questionTypes: [
        'Déterminer si une solution est acide, basique ou neutre',
        'Interpréter un tableau de pH avec indicateurs colorés',
        'Expliquer la réaction entre un acide et un métal',
        'Calculer la concentration d\'un ion en solution',
      ],
    },
  ],
}

// ─── TOUTES LES MATIÈRES ─────────────────────────────────────────────────────

export const ALL_SUBJECTS: SubjectConfig[] = [
  MATHS,
  FRANCAIS,
  HISTOIRE_GEO,
  SVT,
  PHYSIQUE_CHIMIE,
]

// ─── UTILITAIRES DE TIRAGE ───────────────────────────────────────────────────

/**
 * Tire aléatoirement des chapitres pour une matière donnée,
 * en respectant les probabilités de chaque chapitre.
 *
 * Algo : chaque chapitre est inclus avec sa probabilité propre,
 * puis on ajuste pour avoir exactement `config.exercisesToDraw` chapitres.
 */
export function drawChapters(config: SubjectConfig): ChapterDraw[] {
  const { chapters, exercisesToDraw, subject } = config

  // 1. Tirage stochastique : inclure chaque chapitre avec sa probabilité
  const candidates: Chapter[] = []
  for (const ch of chapters) {
    if (Math.random() < ch.probability) {
      candidates.push(ch)
    }
  }

  // 2. Ajuster au nombre exact voulu
  if (candidates.length >= exercisesToDraw) {
    // Trop de chapitres → garder les N avec les probabilités les plus hautes
    const sorted = [...candidates].sort((a, b) => b.probability - a.probability)
    return sorted.slice(0, exercisesToDraw).map((chapter) => ({ chapter, subject }))
  } else {
    // Pas assez → compléter avec les chapitres non tirés les plus probables
    const notDrawn = chapters.filter((ch) => !candidates.includes(ch))
    const sorted = [...notDrawn].sort((a, b) => b.probability - a.probability)
    const complement = sorted.slice(0, exercisesToDraw - candidates.length)
    return [...candidates, ...complement].map((chapter) => ({ chapter, subject }))
  }
}

/**
 * Génère une session brevet complète :
 * tire les chapitres pour chaque matière selon les probabilités des annales.
 */
export function drawBrevetSession(): BrevetSession {
  return {
    maths: drawChapters(MATHS),
    francais: drawChapters(FRANCAIS),
    histoire_geo: drawChapters(HISTOIRE_GEO),
    svt: drawChapters(SVT),
    physique_chimie: drawChapters(PHYSIQUE_CHIMIE),
  }
}

/**
 * Construit le prompt système pour Claude, en lui donnant le contexte
 * de chaque chapitre tiré pour qu'il génère des questions réalistes.
 */
export function buildGenerationPrompt(session: BrevetSession): string {
  const lines: string[] = [
    'Tu es un concepteur de sujets du Brevet des collèges (DNB) français.',
    'Tu dois générer UNE SEULE question par chapitre listé ci-dessous,',
    'en respectant scrupuleusement le style, le niveau et la structure des vraies annales DNB.',
    '',
    'Pour chaque question :',
    '  - Utilise le style des annales officielles (intro contextuelle, données, questions numérotées)',
    '  - Adapte le niveau à un élève de 3e (14-15 ans)',
    '  - Fournis AUSSI un barème de correction détaillé (masqué à l\'élève)',
    '  - La question doit être ouverte (pas de QCM), rédigée comme un vrai brevet',
    '',
    'Chapitres à couvrir :',
  ]

  const allDraws: ChapterDraw[] = [
    ...session.maths,
    ...session.francais,
    ...session.histoire_geo,
    ...session.svt,
    ...session.physique_chimie,
  ]

  for (const draw of allDraws) {
    const { chapter, subject } = draw
    const subjectLabel = ALL_SUBJECTS.find((s) => s.subject === subject)?.label ?? subject
    lines.push(`\n### ${subjectLabel} — ${chapter.label} (${chapter.points} pts)`)
    lines.push(`Contexte programme : ${chapter.promptContext}`)
    lines.push(`Types de questions typiques : ${chapter.questionTypes.join(' / ')}`)
  }

  return lines.join('\n')
}

/**
 * Construit le prompt de notation pour Claude,
 * en lui passant les questions générées + les réponses de l'élève.
 */
export function buildGradingPrompt(params: {
  session: BrevetSession
  questions: Record<string, { question: string; rubric: string; maxPoints: number }>
  answers: Record<string, string>
}): string {
  const { questions, answers } = params

  const lines: string[] = [
    'Tu es un correcteur officiel du Brevet des collèges (DNB) français.',
    'Tu dois noter chaque réponse de l\'élève avec rigueur, en t\'appuyant sur le barème officiel fourni.',
    '',
    'Pour chaque exercice :',
    '  - Donne un score sur le nombre de points maximum',
    '  - Justifie brièvement le score (2-3 lignes maximum)',
    '  - Sois juste mais exigeant, comme un vrai correcteur de brevet',
    '',
    '⚠️ Réponds UNIQUEMENT en JSON avec ce format :',
    '{ "results": { "<id>": { "score": <nombre>, "max": <nombre>, "feedback": "<texte>" } } }',
    '',
    'Exercices à noter :',
  ]

  for (const [id, q] of Object.entries(questions)) {
    lines.push(`\n### Exercice ${id} (/${q.maxPoints} pts)`)
    lines.push(`Question : ${q.question}`)
    lines.push(`Barème : ${q.rubric}`)
    lines.push(`Réponse de l'élève : ${answers[id] ?? '(pas de réponse)'}`)
  }

  return lines.join('\n')
}

// ─── MENTIONS ────────────────────────────────────────────────────────────────

export type Mention =
  | 'insuffisant'
  | 'passable'
  | 'assez_bien'
  | 'bien'
  | 'tres_bien'

export const MENTION_LABELS: Record<Mention, string> = {
  insuffisant: 'Insuffisant',
  passable: 'Passable',
  assez_bien: 'Assez Bien',
  bien: 'Bien',
  tres_bien: 'Très Bien',
}

export function getMention(scorePercent: number): Mention {
  if (scorePercent >= 80) return 'tres_bien'
  if (scorePercent >= 70) return 'bien'
  if (scorePercent >= 60) return 'assez_bien'
  if (scorePercent >= 50) return 'passable'
  return 'insuffisant'
}
