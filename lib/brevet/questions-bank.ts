// lib/brevet/questions-bank.ts
// Banque de questions ouvertes — format DNB réel (métropole, série générale)
// Les corrigés et critères ne sont JAMAIS envoyés au client.

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BankDocument {
  titre: string
  contenu: string
  type: 'texte' | 'tableau' | 'graphique' | 'image' | 'donnees'
}

/** Question complète — côté serveur uniquement */
export interface FullBankQuestion {
  id: string
  matiere: 'Mathématiques' | 'Français' | 'Histoire-Géographie' | 'Physique-Chimie' | 'Sciences de la vie et de la Terre' | 'EMC'
  theme: string
  annee: number
  source: string
  documents?: BankDocument[]
  question: string
  corrige: string      // jamais envoyé au client
  criteres: string[]   // critères binaires pour la notation par Claude
}

/** Question tronquée — stockée en DB / envoyée au client */
export type StoredQuestion = Omit<FullBankQuestion, 'corrige' | 'criteres'>

/** Sujet de rédaction */
export interface RedactionSubject {
  id: string
  annee: number
  type: 'imagination' | 'reflexion'
  texteSupport?: string   // titre du texte de l'épreuve de compréhension
  contexte?: string       // rappel narratif pour les sujets d'imagination
  consigne: string
}

// ─────────────────────────────────────────────────────────────────────────────
// MATHÉMATIQUES — 15 questions, on pioche 3
// ─────────────────────────────────────────────────────────────────────────────

const MATHS_QUESTIONS: FullBankQuestion[] = [
  {
    id: 'mat_2026_01',
    matiere: 'Mathématiques',
    theme: 'Calcul fractionnel',
    annee: 2026,
    source: 'DNB Métropole 2026 — Partie 1 (automatismes)',
    question: 'Calculer A = 2/3 + 3/4. Donner le résultat sous forme de fraction irréductible.',
    corrige: 'A = 8/12 + 9/12 = 17/12',
    criteres: [
      'Le résultat est 17/12 (ou 1 et 5/12)',
      'Le candidat a cherché un dénominateur commun (12)',
    ],
  },
  {
    id: 'mat_2026_02',
    matiere: 'Mathématiques',
    theme: 'Pourcentages',
    annee: 2026,
    source: 'DNB Métropole 2026 — Partie 1 (automatismes)',
    question: 'Un article coûte 45 €. Quel sera son prix après une réduction de 10 % ?',
    corrige: '45 × 0,9 = 40,50 €',
    criteres: [
      'Le résultat est 40,50 €',
      'Le calcul est correct (multiplication par 0,9 ou soustraction de 10 %)',
    ],
  },
  {
    id: 'mat_2026_04',
    matiere: 'Mathématiques',
    theme: 'Équations du premier degré',
    annee: 2026,
    source: 'DNB Métropole 2026 — Partie 1 (automatismes)',
    question: 'Résoudre l\'équation : 5x − 15 = 20.',
    corrige: '5x = 35, donc x = 7',
    criteres: ['La solution est x = 7'],
  },
  {
    id: 'mat_2026_06',
    matiere: 'Mathématiques',
    theme: 'Statistiques — médiane',
    annee: 2026,
    source: 'DNB Métropole 2026 — Partie 1 (automatismes)',
    question: 'Voici une série de nombres : 8 ; 19 ; 12 ; 3 ; 12 ; 25 ; 3 ; 11 ; 1. Déterminer la médiane de cette série.',
    corrige: 'Série ordonnée : 1 ; 3 ; 3 ; 8 ; 11 ; 12 ; 12 ; 19 ; 25. La médiane est la 5ᵉ valeur : 11.',
    criteres: [
      'La médiane est 11',
      'La série est ordonnée ou la démarche est expliquée',
    ],
  },
  {
    id: 'mat_s0_01',
    matiere: 'Mathématiques',
    theme: 'Calcul mental',
    annee: 2023,
    source: 'DNB Sujet 0 — Partie 1 (automatismes)',
    question: 'Quel est le tiers de 18 ?',
    corrige: '18 ÷ 3 = 6',
    criteres: ['La réponse est 6'],
  },
  {
    id: 'mat_s0_02',
    matiere: 'Mathématiques',
    theme: 'Conversions — durées',
    annee: 2023,
    source: 'DNB Sujet 0 — Partie 1 (automatismes)',
    question: 'Un film dure 240 minutes. Quelle est sa durée en heures ?',
    corrige: '240 ÷ 60 = 4 heures',
    criteres: ['La réponse est 4 heures', 'La division par 60 est utilisée'],
  },
  {
    id: 'mat_s0_03',
    matiere: 'Mathématiques',
    theme: 'Statistiques — médiane',
    annee: 2023,
    source: 'DNB Sujet 0 — Partie 1 (automatismes)',
    question: 'Les notes obtenues par un élève sont : 8 ; 12 ; 6 ; 19 ; 15. Quelle est la médiane de cette série ?',
    corrige: 'Série ordonnée : 6 ; 8 ; 12 ; 15 ; 19. La médiane est la 3ᵉ valeur : 12.',
    criteres: ['La médiane est 12', 'La série est ordonnée'],
  },
  {
    id: 'mat_s0_08',
    matiere: 'Mathématiques',
    theme: 'Pourcentages',
    annee: 2023,
    source: 'DNB Sujet 0 — Partie 1 (automatismes)',
    question: 'Dans un collège, 25 % des 300 élèves participent à une olympiade de mathématiques. Combien d\'élèves ne participent pas ?',
    corrige: '25 % × 300 = 75 élèves participent. 300 − 75 = 225 élèves ne participent pas.',
    criteres: [
      'La réponse est 225 élèves',
      'Le calcul est correct : 25 % de 300 = 75, puis 300 − 75',
    ],
  },
  {
    id: 'mat_gen_01',
    matiere: 'Mathématiques',
    theme: 'Calcul fractionnel',
    annee: 2024,
    source: 'DNB — calcul automatisme',
    question: 'Calculer 3/5 × 10/9. Simplifier le résultat.',
    corrige: '3/5 × 10/9 = 30/45 = 2/3',
    criteres: ['Le résultat est 2/3'],
  },
  {
    id: 'mat_gen_02',
    matiere: 'Mathématiques',
    theme: 'Vitesse, distance, durée',
    annee: 2024,
    source: 'DNB — calcul automatisme',
    question: 'Une voiture roule à 90 km/h pendant 2 h 30 min. Quelle distance a-t-elle parcourue ?',
    corrige: '2 h 30 min = 2,5 h. d = 90 × 2,5 = 225 km.',
    criteres: [
      'La réponse est 225 km',
      'La conversion 2 h 30 min = 2,5 h est effectuée',
    ],
  },
  {
    id: 'mat_gen_03',
    matiere: 'Mathématiques',
    theme: 'Pourcentages',
    annee: 2024,
    source: 'DNB — calcul automatisme',
    question: 'Dans une classe de 30 élèves, 40 % sont des filles. Combien y a-t-il de garçons ?',
    corrige: '40 % × 30 = 12 filles. 30 − 12 = 18 garçons.',
    criteres: ['La réponse est 18 garçons', 'Le calcul est correct'],
  },
  {
    id: 'mat_gen_04',
    matiere: 'Mathématiques',
    theme: 'Équations du premier degré',
    annee: 2022,
    source: 'DNB — calcul automatisme',
    question: 'Résoudre l\'équation : 3x + 6 = 21.',
    corrige: '3x = 15, donc x = 5.',
    criteres: ['La solution est x = 5'],
  },
  {
    id: 'mat_gen_05',
    matiere: 'Mathématiques',
    theme: 'Périmètre et aire',
    annee: 2022,
    source: 'DNB — calcul automatisme',
    question: 'Calculer le périmètre d\'un cercle de rayon 5 cm. (Prendre π ≈ 3,14)',
    corrige: 'P = 2 × π × r = 2 × 3,14 × 5 = 31,4 cm.',
    criteres: ['La réponse est 31,4 cm', 'La formule P = 2πr est utilisée'],
  },
  {
    id: 'mat_gen_06',
    matiere: 'Mathématiques',
    theme: 'Pourcentages',
    annee: 2021,
    source: 'DNB — calcul automatisme',
    question: 'Un article coûtait 80 €. Le magasin affiche une promotion « −20 % ». Quel est le nouveau prix ?',
    corrige: '80 × 0,8 = 64 € (ou 80 − 16 = 64 €).',
    criteres: ['La réponse est 64 €'],
  },
  {
    id: 'mat_gen_07',
    matiere: 'Mathématiques',
    theme: 'Théorème de Pythagore',
    annee: 2021,
    source: 'DNB — calcul automatisme',
    question: 'Dans un triangle ABC rectangle en A, AB = 3 cm et BC = 5 cm. Calculer AC.',
    corrige: 'D\'après le théorème de Pythagore : BC² = AB² + AC² → AC² = 25 − 9 = 16 → AC = 4 cm.',
    criteres: [
      'La réponse est AC = 4 cm',
      'Le théorème de Pythagore est appliqué correctement',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// FRANÇAIS — 16 questions, on pioche 5
// ─────────────────────────────────────────────────────────────────────────────

const FRANCAIS_QUESTIONS: FullBankQuestion[] = [
  // ── 2026 · Paul Fournel, « Pantoum Patate » ──────────────────────────────
  {
    id: 'fr_2026_01',
    matiere: 'Français',
    theme: 'Genre littéraire — poésie',
    annee: 2026,
    source: 'DNB Métropole 2026 — Compréhension',
    documents: [
      {
        titre: 'Paul Fournel, « Pantoum Patate », Le Bel Appétit (2015) — extrait',
        type: 'texte',
        contenu: `Tu frémis dans la graisse d'oie,
Je te salue pomme de terre
Tu mollis dans le feu de bois,
Ma nourriture débonnaire

Je te salue pomme de terre.
Patate universelle !
Ma nourriture débonnaire,
En fines frites ou en rondelles.

Patate universelle,
Je te farcis et je t'écrase,
En petits cubes et en rondelles
Que tu sois d'Amiens ou de Boise

Je te farcis et je t'écrase,
Je t'offre noix de beurre et lait,
Que tu sois d'Amiens ou de Boise
Joie du bébé, joie du gourmet.

[…]
Le monde entier en redemande,
Il t'aime vieille ou bien nouvelle.`,
      },
    ],
    question: 'À quel genre littéraire appartient ce texte ? Donnez deux éléments de justification tirés du texte.',
    corrige: 'Ce texte appartient au genre poétique (poésie). Justifications possibles : (1) il est écrit en vers ; (2) il est organisé en strophes régulières (quatrains) ; (3) il utilise des rimes ; (4) le langage est imagé et musical.',
    criteres: [
      'Le genre identifié est la poésie (ou le poème)',
      'Au moins deux éléments de justification sont donnés (vers, strophes, rimes, langage imagé…)',
    ],
  },
  {
    id: 'fr_2026_02',
    matiere: 'Français',
    theme: 'Compréhension — interlocuteur',
    annee: 2026,
    source: 'DNB Métropole 2026 — Compréhension',
    documents: [
      {
        titre: 'Paul Fournel, « Pantoum Patate » (2015) — extrait',
        type: 'texte',
        contenu: `Tu frémis dans la graisse d'oie,
Je te salue pomme de terre
[…]
Joie du bébé, joie du gourmet.
Le monde entier en redemande.`,
      },
    ],
    question: 'À qui s\'adresse le « je » dans ce texte ? Citez un vers pour justifier votre réponse.',
    corrige: 'Le « je » s\'adresse à la pomme de terre (la patate). Justification possible : « Je te salue pomme de terre » ou « Tu frémis dans la graisse d\'oie ».',
    criteres: [
      'L\'interlocuteur identifié est la pomme de terre (ou la patate)',
      'Une citation pertinente du texte est fournie',
    ],
  },
  {
    id: 'fr_2026_03',
    matiere: 'Français',
    theme: 'Compréhension — sens d\'un mot',
    annee: 2026,
    source: 'DNB Métropole 2026 — Compréhension',
    documents: [
      {
        titre: 'Paul Fournel, « Pantoum Patate » (2015) — extrait',
        type: 'texte',
        contenu: `Patate universelle !
[…]
Que tu sois d'Amiens ou de Boise
Joie du bébé, joie du gourmet.
[…]
Le monde entier en redemande,
Il t'aime vieille ou bien nouvelle.`,
      },
    ],
    question: 'Pourquoi la patate est-elle qualifiée d\'« universelle » dans ce texte ? Donnez deux raisons justifiées par des citations.',
    corrige: '(1) Elle est consommée partout dans le monde — « Que tu sois d\'Amiens ou de Boise » (France et États-Unis) / « Le monde entier en redemande ». (2) Elle convient à tous les âges et toutes les personnes — « Joie du bébé, joie du gourmet ».',
    criteres: [
      'Une première raison est identifiée (consommée partout dans le monde) avec citation',
      'Une seconde raison est identifiée (convient à tous) avec citation',
    ],
  },

  // ── 2025 · Simone de Beauvoir, La Force de l'âge ─────────────────────────
  {
    id: 'fr_2025_01',
    matiere: 'Français',
    theme: 'Compréhension — intention du personnage',
    annee: 2025,
    source: 'DNB Métropole 2025 — Compréhension',
    documents: [
      {
        titre: 'Simone de Beauvoir, La Force de l\'âge (1960) — extrait',
        type: 'texte',
        contenu: `La narratrice, Simone, a vingt-trois ans. Elle quitte sa ville natale, Paris, et arrive seule à Marseille.

Je me rappelle mon arrivée à Marseille comme si elle avait marqué dans mon histoire un tournant absolument neuf. Ici, je n'existais pour personne ; quelque part, sous un de ces toits, j'aurais à faire quatorze heures de cours chaque semaine : rien d'autre n'était prévu pour moi, pas même le lit où je dormirais ; mes occupations, mes habitudes, mes plaisirs, c'était à moi de les inventer.

Deux heures plus tard, j'avais rendu visite à la directrice du lycée, mon emploi du temps était fixé ; sans connaître Marseille, déjà j'y habitais.`,
      },
    ],
    question: 'Que vient faire la narratrice à Marseille ? Justifiez votre réponse par deux citations du texte.',
    corrige: 'La narratrice vient travailler comme professeure à Marseille. Citations possibles : « quatorze heures de cours chaque semaine » / « j\'avais rendu visite à la directrice du lycée, mon emploi du temps était fixé ».',
    criteres: [
      'La réponse identifie que la narratrice vient travailler (comme professeure)',
      'Deux citations pertinentes sont fournies',
    ],
  },
  {
    id: 'fr_2025_02',
    matiere: 'Français',
    theme: 'Compréhension — indices de rupture',
    annee: 2025,
    source: 'DNB Métropole 2025 — Compréhension',
    documents: [
      {
        titre: 'Simone de Beauvoir, La Force de l\'âge (1960) — extrait',
        type: 'texte',
        contenu: `Jusqu'alors, j'avais dépendu étroitement d'autrui ; on m'avait imposé des cadres et des buts. Ici, je n'existais pour personne ; rien d'autre n'était prévu pour moi, pas même le lit où je dormirais ; mes occupations, mes habitudes, mes plaisirs, c'était à moi de les inventer.`,
      },
    ],
    question: 'Citez deux éléments du texte qui montrent qu\'une vie nouvelle commence pour la narratrice.',
    corrige: '(1) « je n\'existais pour personne » — elle repart de zéro. (2) « pas même le lit où je dormirais » / « mes occupations, mes habitudes, mes plaisirs, c\'était à moi de les inventer » — elle doit tout construire seule.',
    criteres: [
      'Un premier élément pertinent est cité avec une référence au texte',
      'Un second élément pertinent est cité avec une référence au texte',
    ],
  },
  {
    id: 'fr_2025_03',
    matiere: 'Français',
    theme: 'Procédés d\'écriture — accumulation',
    annee: 2025,
    source: 'DNB Métropole 2025 — Compréhension',
    documents: [
      {
        titre: 'Simone de Beauvoir, La Force de l\'âge (1960) — extrait',
        type: 'texte',
        contenu: `J'eus le coup de foudre. Je grimpai sur toutes ses rocailles, je rôdai dans toutes ses ruelles, je respirai le goudron et les oursins du Vieux-Port, je me mêlai aux foules de la Canebière, je m'assis dans des allées, dans des jardins, sur des cours paisibles où la provinciale odeur des feuilles mortes étouffait celle du vent marin.`,
      },
    ],
    question: 'Quel procédé d\'écriture l\'auteure utilise-t-elle dans ce passage pour exprimer son émerveillement pour Marseille ? Nommez-le et expliquez l\'effet produit.',
    corrige: 'L\'auteure utilise une énumération (ou accumulation / anaphore avec « je »). Effet : ce procédé traduit l\'énergie, l\'enthousiasme et l\'avidité de la narratrice qui explore Marseille en tous sens, sans s\'arrêter.',
    criteres: [
      'Le procédé est correctement identifié (énumération, accumulation ou anaphore)',
      'L\'effet est expliqué (énergie, enthousiasme, découverte active…)',
    ],
  },
  {
    id: 'fr_2025_gram',
    matiere: 'Français',
    theme: 'Grammaire — classe grammaticale et accord',
    annee: 2025,
    source: 'DNB Métropole 2025 — Grammaire',
    documents: [
      {
        titre: 'Phrase extraite de La Force de l\'âge (1960)',
        type: 'texte',
        contenu: '« J\'étais là, seule, les mains vides, séparée de mon passé et de tout ce que j\'aimais. »',
      },
    ],
    question: 'Quelle est la classe grammaticale du mot « seule » dans cette phrase ? Justifiez la terminaison de ce mot.',
    corrige: '« Seule » est un adjectif qualificatif (épithète détachée, attribut du sujet « je »). La terminaison -e est due à l\'accord avec le sujet « je » qui désigne la narratrice, une femme.',
    criteres: [
      'La classe grammaticale est correctement identifiée (adjectif qualificatif)',
      'L\'accord (féminin singulier, accord avec « je » féminin) est justifié',
    ],
  },


  // ── 2024 · Marc Dugain, La chambre des officiers ─────────────────────────
  {
    id: 'fr_2024_01',
    matiere: 'Français',
    theme: 'Compréhension — personnages',
    annee: 2024,
    source: 'DNB Métropole 2024 — Compréhension',
    documents: [
      {
        titre: 'Marc Dugain, La chambre des officiers (1999) — extrait',
        type: 'texte',
        contenu: `Adrien Fournier, le narrateur, et ses deux amis, Penanster et Weil, sont trois officiers gravement blessés au visage durant la Première Guerre mondiale. Ils sont soignés à l'hôpital du Val-de-Grâce.

Nos blessures ne pouvaient qu'effrayer cette femme qui se réfléchissait en nous, miroirs de son infortune, mais lorsque, après des jours d'attente et de guet, elle sortit et se trouva devant Penanster, elle ne se déroba point.
— Nous formons, lui expliqua-t-il, un club d'officiers qui compte à ce jour trois membres actifs et volontiers bienfaiteurs. Nous nous sommes aperçus qu'il y manquait une femme. Voulez-vous en faire partie ?`,
      },
    ],
    question: "Qui sont les membres du « club d'officiers » ? Quelle caractéristique les unit ?",
    corrige: "Les membres sont Adrien Fournier (le narrateur), Penanster et Weil. Ce qui les unit : ils sont tous trois officiers gravement blessés au visage pendant la Première Guerre mondiale.",
    criteres: [
      'Les trois membres sont identifiés (Adrien/narrateur, Penanster, Weil)',
      'La caractéristique commune est mentionnée (blessés au visage / Grande Guerre)',
    ],
  },
  {
    id: 'fr_2024_02',
    matiere: 'Français',
    theme: 'Compréhension — obstacle à la communication',
    annee: 2024,
    source: 'DNB Métropole 2024 — Compréhension',
    documents: [
      {
        titre: 'Marc Dugain, La chambre des officiers (1999) — extrait',
        type: 'texte',
        contenu: `Penanster comprit alors qu'elle était sourde et ne pouvait que lire sur les lèvres. Lui seul avait une bouche intacte, où les mots prenaient forme. Je compris aussitôt que ni Weil ni moi ne pourrions jamais nous entretenir avec elle, les mouvements de nos lèvres étaient devenus sans signification car le son des mots reconstitués tels que nous les formions ne parviendrait jamais à son oreille.`,
      },
    ],
    question: 'Pourquoi ni Weil ni Adrien ne peuvent-ils communiquer directement avec Marguerite ?',
    corrige: "Marguerite est sourde et communique en lisant sur les lèvres. Les blessures au visage de Weil et d'Adrien ont déformé leurs lèvres, rendant impossible la lecture labiale. Seul Penanster a une bouche intacte.",
    criteres: [
      'La surdité de Marguerite et sa communication par lecture labiale sont mentionnées',
      "L'impossibilité de lire sur les lèvres d'Adrien et Weil (blessures au visage) est expliquée",
    ],
  },
  {
    id: 'fr_2024_03',
    matiere: 'Français',
    theme: 'Figure de style — comparaison',
    annee: 2024,
    source: 'DNB Métropole 2024 — Compréhension',
    documents: [
      {
        titre: 'Marc Dugain, La chambre des officiers (1999)',
        type: 'texte',
        contenu: '« Elle était comme un parterre de roses saccagé par le milieu. Elle avait été touchée au nez et aux pommettes. »',
      },
    ],
    question: 'Identifiez la figure de style dans « Elle était comme un parterre de roses saccagé par le milieu » et expliquez pourquoi elle est adaptée pour décrire Marguerite.',
    corrige: "Comparaison (outil : « comme »). Elle est adaptée car Marguerite est très belle (roses) mais blessée en plein centre du visage — nez et pommettes — comme un parterre de fleurs saccagé en son milieu.",
    criteres: [
      'La figure de style est correctement identifiée (comparaison)',
      "L'adéquation de la figure au personnage est expliquée (beauté + blessure centrale)",
    ],
  },
  {
    id: 'fr_2024_04',
    matiere: 'Français',
    theme: "Compréhension — motivations d'un personnage",
    annee: 2024,
    source: 'DNB Métropole 2024 — Compréhension',
    documents: [
      {
        titre: 'Marc Dugain, La chambre des officiers (1999) — extrait',
        type: 'texte',
        contenu: `Vers la fin de 1915, on manquait d'infirmières. Marguerite s'était portée volontaire. Elle était à cette époque aussi belle qu'inutile. Son père était un orfèvre fortuné, et elle ne manquait pas de prétendants, tous réformés ou embusqués. Elle rêvait de s'éprendre d'un homme courageux.`,
      },
    ],
    question: 'Citez deux raisons pour lesquelles Marguerite souhaitait engager comme infirmière de guerre.',
    corrige: "(1) Elle se sentait inutile : « aussi belle qu'inutile ». (2) Elle désirait rencontrer un homme courageux : « Elle rêvait de s'éprendre d'un homme courageux ».",
    criteres: [
      "Première raison identifiée (sentiment d'inutilité / désir de servir) avec citation",
      'Seconde raison identifiée (désir d\'un homme courageux) avec citation',
    ],
  },

  // ── 2023 · George Sand, Histoire de ma vie ───────────────────────────────
  {
    id: 'fr_2023_01',
    matiere: 'Français',
    theme: 'Compréhension — cadre spatio-temporel',
    annee: 2023,
    source: 'DNB Métropole 2023 — Compréhension',
    documents: [
      {
        titre: 'George Sand, Histoire de ma vie (1855) — extrait',
        type: 'texte',
        contenu: `Nous avions trouvé un jeu qui passionnait nos imaginations. Il s'agissait de passer la rivière. La rivière était dessinée sur le carreau avec de la craie et faisait mille détours dans cette grande chambre. En de certains endroits elle était fort profonde, il fallait trouver l'endroit guéable et ne pas se tromper. Hippolyte s'était déjà noyé plusieurs fois, nous l'aidions à se retirer des grands trous où il tombait toujours, car il faisait le rôle du maladroit ou de l'homme ivre, et il nageait à sec sur le carreau en se débattant et en se lamentant.`,
      },
    ],
    question: 'Où se passe la scène ? Comment expliquer la présence d\'une rivière dans ce lieu ? Justifiez par une citation.',
    corrige: 'La scène se passe dans une chambre. La rivière a été dessinée à la craie sur le carrelage par les enfants pour jouer — « La rivière était dessinée sur le carreau avec de la craie ».',
    criteres: [
      'Le lieu est correctement identifié (une chambre)',
      "L'origine fictive de la rivière (dessinée à la craie) est expliquée avec une citation",
    ],
  },
  {
    id: 'fr_2023_02',
    matiere: 'Français',
    theme: 'Champ lexical du théâtre',
    annee: 2023,
    source: 'DNB Métropole 2023 — Compréhension',
    documents: [
      {
        titre: 'George Sand, Histoire de ma vie (1855) — extrait',
        type: 'texte',
        contenu: `Pour les enfants ces jeux-là sont tout un drame, toute une fiction scénique, parfois tout un roman, tout un poème. Les enfants s'appellent vous dans ces sortes de mimodrames. Ils ne croiraient pas jouer une scène s'ils se tutoyaient comme à l'ordinaire. Ils représentent toujours certains personnages. Ils ont même des dialogues très vrais et que des acteurs de profession seraient bien embarrassés d'improviser sur la scène. Tel fut le dénouement imprévu et dramatique de notre représentation, et la toile tomba sur des larmes et des cris véritables.`,
      },
    ],
    question: 'Relevez quatre mots ou expressions appartenant au champ lexical du théâtre dans cet extrait.',
    corrige: 'Parmi les réponses possibles : drame, fiction scénique, mimodrame, scène, acteurs, représentation, toile, dénouement, personnages, dialogues.',
    criteres: [
      'Au moins quatre termes du champ lexical du théâtre sont relevés',
      'Les termes retenus appartiennent effectivement au texte',
    ],
  },
  {
    id: 'fr_2023_03',
    matiere: 'Français',
    theme: 'Compréhension — illusion et réalité',
    annee: 2023,
    source: 'DNB Métropole 2023 — Compréhension',
    documents: [
      {
        titre: 'George Sand, Histoire de ma vie (1855) — extrait',
        type: 'texte',
        contenu: `Pour mon compte, il ne me fallait pas cinq minutes pour m'y plonger de si bonne foi, que je perdais la notion de la réalité, et je croyais voir les arbres, les eaux, les rochers, une vaste campagne. À peine fus-je déchaussée, que le froid du carreau me fit l'effet de l'eau véritable, et nous voilà, Ursule et moi, pataugeant dans le ruisseau.`,
      },
    ],
    question: 'Citez un exemple du texte montrant que les enfants confondent le jeu et la réalité.',
    corrige: "Exemples possibles : « le froid du carreau me fit l'effet de l'eau véritable » ; « je perdais la notion de la réalité » ; « je croyais voir les arbres, les eaux, les rochers ».",
    criteres: [
      'Un exemple précis est cité (avec une référence au texte)',
      'L\'exemple illustre bien la confusion entre jeu et réalité',
    ],
  },

  // ── Grammaire 2025 ────────────────────────────────────────────────────────
  {
    id: 'fr_gram_juxt',
    matiere: 'Français',
    theme: 'Grammaire — juxtaposition',
    annee: 2025,
    source: 'DNB Métropole 2025 — Grammaire',
    documents: [
      {
        titre: "Phrase extraite de La Force de l'âge (Simone de Beauvoir, 1960)",
        type: 'texte',
        contenu: '« j\'avais rendu visite à la directrice du lycée, mon emploi du temps était fixé »',
      },
    ],
    question: 'Identifiez les propositions dans cette phrase et précisez comment elles sont reliées.',
    corrige: "Il y a deux propositions indépendantes juxtaposées : [j'avais rendu visite à la directrice du lycée] et [mon emploi du temps était fixé]. Elles sont reliées par juxtaposition (virgule, sans conjonction).",
    criteres: [
      'Les deux propositions sont correctement identifiées',
      'Le lien est identifié comme juxtaposition (pas de conjonction)',
    ],
  },
]



// ─────────────────────────────────────────────────────────────────────────────
// HISTOIRE-GÉOGRAPHIE / EMC — 22 questions, on pioche 6
// ─────────────────────────────────────────────────────────────────────────────

const HG_QUESTIONS: FullBankQuestion[] = [
  // ── 2026 · Géo — Espaces productifs ──────────────────────────────────────
  {
    id: 'hg_2026_geo_01',
    matiere: 'Histoire-Géographie',
    theme: 'Espaces productifs — désindustrialisation',
    annee: 2026,
    source: 'DNB Métropole 2026 — Géographie',
    documents: [
      {
        titre: 'Dynamiques des espaces productifs industriels français (Charlotte Ruggeri, 2025)',
        type: 'texte',
        contenu: `Le contexte mondial inscrit la désindustrialisation et la concurrence mondiale dans de nombreuses régions, notamment les anciennes régions industrielles. Néanmoins, l'industrie ne disparaît pas, elle se recompose. En effet, dès les années 1960, l'industrie se déplace vers les littoraux (processus de littoralisation). De grandes zones industrialo-portuaires voient le jour, comme celle de Dunkerque, qui accueille l'industrie sidérurgique qui disparaît progressivement de la Lorraine. De même, les espaces frontaliers accueillent des usines, comme l'usine Toyota près de Valenciennes, témoignant d'une intégration européenne et mondiale accrue. Sans pour autant parler de réindustrialisation, les chiffres montrent une progression de l'emploi industriel en France avec 130 000 emplois créés depuis 2017.`,
      },
    ],
    question: 'Relevez dans le document une cause du déclin des espaces anciennement industrialisés.',
    corrige: 'La désindustrialisation et/ou la concurrence mondiale sont les causes du déclin des anciennes régions industrielles.',
    criteres: [
      'Une cause est correctement relevée (désindustrialisation / concurrence mondiale)',
      'La réponse s\'appuie sur le document',
    ],
  },
  {
    id: 'hg_2026_geo_02',
    matiere: 'Histoire-Géographie',
    theme: 'Espaces productifs — nouvelles localisations',
    annee: 2026,
    source: 'DNB Métropole 2026 — Géographie',
    documents: [
      {
        titre: 'Espaces productifs industriels français (extrait)',
        type: 'texte',
        contenu: `Dès les années 1960, l'industrie se déplace vers les littoraux (processus de littoralisation). De grandes zones industrialo-portuaires voient le jour, comme Dunkerque. De même, les espaces frontaliers accueillent des usines, comme l'usine Toyota près de Valenciennes, témoignant d'une intégration européenne et mondiale accrue.`,
      },
    ],
    question: "Citez deux types d'espaces qui accueillent les nouvelles localisations des activités industrielles sur le territoire français.",
    corrige: 'Les littoraux (zones industrialo-portuaires, comme Dunkerque) et les espaces frontaliers (comme Valenciennes avec Toyota).',
    criteres: [
      'Les espaces littoraux (ou zones industrialo-portuaires) sont mentionnés',
      'Les espaces frontaliers sont mentionnés',
    ],
  },
  // ── 2026 · EMC — 11 novembre ─────────────────────────────────────────────
  {
    id: 'hg_2026_emc_01',
    matiere: 'EMC',
    theme: 'Mémoire nationale — 11 novembre',
    annee: 2026,
    source: 'DNB Métropole 2026 — EMC',
    documents: [
      {
        titre: 'Loi du 28 février 2012 fixant au 11 novembre la commémoration de tous les morts pour la France',
        type: 'texte',
        contenu: `La loi du 28 février 2012 prévoit que la journée du 11 novembre, jour anniversaire de l'armistice de 1918 et de « commémoration de la victoire et de la paix », soit aussi un jour d'hommage à l'ensemble de ceux qui sont « morts pour la France » qu'ils soient civils ou militaires, qu'ils aient péri dans des conflits actuels ou des conflits anciens. Ce texte permet notamment de rendre hommage à tous ceux qui ont péri au cours d'opérations extérieures.`,
      },
    ],
    question: 'Identifiez ce que la République commémore chaque année le 11 novembre (deux éléments de réponse attendus).',
    corrige: "(1) La victoire et la paix de 1918 (armistice de la Première Guerre mondiale). (2) L'hommage à tous les morts pour la France, civils et militaires, de tous les conflits.",
    criteres: [
      "L'armistice de 1918 / victoire et paix est mentionné",
      "L'hommage à tous les morts pour la France (civils, militaires, tous conflits) est mentionné",
    ],
  },
  {
    id: 'hg_2026_emc_02',
    matiere: 'EMC',
    theme: 'Valeurs de la République — commémoration',
    annee: 2026,
    source: 'DNB Métropole 2026 — EMC',
    documents: [
      {
        titre: 'Loi du 28 février 2012 (extrait)',
        type: 'texte',
        contenu: `La journée du 11 novembre est un jour d'hommage à l'ensemble de ceux qui sont « morts pour la France » qu'ils soient civils ou militaires, qu'ils aient péri dans des conflits actuels ou des conflits anciens.`,
      },
    ],
    question: "Nommez une valeur de la République que l'on peut associer à la journée du 11 novembre et justifiez votre réponse en 2 à 3 lignes.",
    corrige: "Valeurs possibles : la fraternité (hommage collectif) ; l'égalité (tous les morts honorés, civils comme militaires) ; la liberté (ils ont combattu pour défendre la liberté). La réponse doit relier la valeur choisie à la commémoration.",
    criteres: [
      'Une valeur républicaine est identifiée (liberté, égalité, fraternité)',
      'La justification établit un lien entre la valeur et le 11 novembre',
    ],
  },
  // ── 2025 · Géo — Vallée de la batterie ──────────────────────────────────
  {
    id: 'hg_2025_geo_01',
    matiere: 'Histoire-Géographie',
    theme: 'Espaces productifs — gigafactory',
    annee: 2025,
    source: 'DNB Métropole 2025 — Géographie',
    documents: [
      {
        titre: "La région Hauts-de-France devient la « vallée de la batterie » (La Voix du Nord, 2022)",
        type: 'texte',
        contenu: `L'annonce de l'implantation à Dunkerque d'une troisième gigafactory positionne les Hauts-de-France en région leader de l'industrie automobile de demain. De Dunkerque à Douai en passant par Douvrin, notre région va accueillir les trois gigafactorys françaises, ces usines de fabrication de batteries et de leurs composants. Emmanuel Macron annonçait l'implantation de Verkor, la première gigafactory de cellules de batteries bas carbone en France. Un investissement de près de 2,5 milliards d'euros (dont 60 millions de la Région), représentant un potentiel de 2 000 emplois directs et 5 000 emplois indirects.`,
      },
    ],
    question: "Relevez un extrait du texte qui définit ce qu'est une gigafactory.",
    corrige: "« ces usines de fabrication de batteries et de leurs composants ».",
    criteres: [
      "L'extrait « ces usines de fabrication de batteries et de leurs composants » est relevé (ou reformulé fidèlement)",
    ],
  },
  {
    id: 'hg_2025_geo_02',
    matiere: 'Histoire-Géographie',
    theme: 'Espaces productifs — acteurs',
    annee: 2025,
    source: 'DNB Métropole 2025 — Géographie',
    documents: [
      {
        titre: "La « vallée de la batterie » (La Voix du Nord, 2022) — extrait",
        type: 'texte',
        contenu: `Emmanuel Macron annonçait l'implantation de Verkor dans la zone du Grand Port maritime de Dunkerque. Un investissement de près de 2,5 milliards d'euros (dont 60 millions de la Région). L'Association régionale de l'industrie automobile (ARIA) souligne que le marché des voitures électriques ne doit pas échapper aux entreprises françaises.`,
      },
    ],
    question: "Identifiez deux types d'acteurs qui participent au développement de la « vallée de la batterie ».",
    corrige: "L'État (représenté par Emmanuel Macron), la Région Hauts-de-France (60 M€ engagés), les entreprises privées (Verkor, ARIA). Deux de ces acteurs suffisent.",
    criteres: [
      'Un premier acteur est identifié (État / pouvoir politique ou entreprise)',
      'Un second acteur distinct est identifié (Région ou autre acteur)',
    ],
  },
  // ── 2025 · EMC — Égalité femmes-hommes ───────────────────────────────────
  {
    id: 'hg_2025_emc_01',
    matiere: 'EMC',
    theme: "Égalité — valeur républicaine",
    annee: 2025,
    source: 'DNB Métropole 2025 — EMC',
    documents: [
      {
        titre: "Extrait de la Constitution de la Ve République",
        type: 'texte',
        contenu: `ARTICLE PREMIER — La France est une République indivisible, laïque, démocratique et sociale. Elle assure l'égalité devant la loi de tous les citoyens sans distinction d'origine, de race ou de religion. Elle respecte toutes les croyances. La loi favorise l'égal accès des femmes et des hommes aux mandats électoraux et fonctions électives, ainsi qu'aux responsabilités professionnelles et sociales.`,
      },
    ],
    question: "Relevez un extrait de la Constitution qui montre que l'égalité est une valeur de la République.",
    corrige: "« Elle assure l'égalité devant la loi de tous les citoyens sans distinction d'origine, de race ou de religion » ou « La loi favorise l'égal accès des femmes et des hommes… ».",
    criteres: [
      "Un extrait pertinent de la Constitution mentionnant l'égalité est relevé",
    ],
  },
  // ── 2024 · Histoire — Auschwitz ──────────────────────────────────────────
  {
    id: 'hg_2024_hist_01',
    matiere: 'Histoire-Géographie',
    theme: 'Deuxième Guerre mondiale — génocide',
    annee: 2024,
    source: 'DNB Métropole 2024 — Histoire',
    documents: [
      {
        titre: "Ginette Kolinka, Retour à Birkenau (2020) — extrait",
        type: 'texte',
        contenu: `Ginette Kolinka est née en 1925 dans une famille juive. Arrêtée par la Gestapo en mars 1944, elle est déportée à Auschwitz-Birkenau.

Le soir, pour rejoindre nos baraques, nous défilons devant une rangée d'officiers. La musique militaire nous force à garder la cadence, même épuisées. Si l'une d'entre nous défaille ou sort du rang, elle est frappée.
Des heures au garde-à-vous, gelées, tremblantes, épuisées. Parfois, il y en a une qui tombe de fatigue ou de fièvre.
Prenez un pain de mie, coupez-le en cinq : une tranche de pain par personne plus une petite plaque de margarine. C'est le repas du soir, de tous les jours.`,
      },
    ],
    question: 'Identifiez la nature de ce document et présentez son auteure.',
    corrige: "Il s'agit d'un témoignage (mémoires). L'auteure est Ginette Kolinka, rescapée du camp d'Auschwitz-Birkenau, née en 1925 dans une famille juive, déportée en 1944.",
    criteres: [
      'La nature du document est correctement identifiée (témoignage / mémoires)',
      "L'auteure est identifiée (Ginette Kolinka, déportée rescapée)",
    ],
  },
  {
    id: 'hg_2024_hist_02',
    matiere: 'Histoire-Géographie',
    theme: 'Deuxième Guerre mondiale — violence dans les camps',
    annee: 2024,
    source: 'DNB Métropole 2024 — Histoire',
    documents: [
      {
        titre: "Ginette Kolinka, Retour à Birkenau (2020) — extrait",
        type: 'texte',
        contenu: `Si l'une d'entre nous défaille ou sort du rang, elle est frappée. Des heures au garde-à-vous, gelées, tremblantes, épuisées. Je voudrais m'asseoir, m'écrouler, dormir, mais il faut rester debout. Parfois, il y en a une qui tombe de fatigue ou de fièvre.
Prenez un pain de mie, coupez-le en cinq : une tranche de pain par personne plus une petite plaque de margarine.`,
      },
    ],
    question: 'Relevez trois passages du texte qui montrent différentes formes de violence subies par les déportées.',
    corrige: "(1) Violence physique : « elle est frappée ». (2) Épuisement / violence des conditions : « gelées, tremblantes, épuisées », debout des heures. (3) Privation alimentaire : ration dérisoire (une tranche de pain par jour).",
    criteres: [
      'Trois formes distinctes de violence sont identifiées (physique, épuisement, malnutrition)',
      'Trois citations du texte sont fournies',
    ],
  },
  {
    id: 'hg_2024_emc_01',
    matiere: 'EMC',
    theme: 'Engagement citoyen — Service Civique',
    annee: 2024,
    source: 'DNB Métropole 2024 — EMC',
    documents: [
      {
        titre: "Témoignage de Bastien, 200 000e volontaire du Service Civique",
        type: 'texte',
        contenu: `Pourquoi vous engager ? Alors que j'étais bénévole aux Restos du Cœur, on m'a parlé du Service Civique. J'ai tout de suite été séduit par la démarche d'utilité publique et d'intérêt général.
En quoi consiste votre mission ? Il s'agit d'une mission dans les parcs de la commune d'Avignon, avec un large volet de prévention et de sensibilisation des usagers à l'environnement.`,
      },
    ],
    question: "Identifiez les deux expériences d'engagement de Bastien.",
    corrige: "(1) Bénévolat aux Restos du Cœur. (2) Mission de Service Civique dans les parcs d'Avignon (sensibilisation à l'environnement).",
    criteres: [
      'Le bénévolat aux Restos du Cœur est identifié',
      "La mission Service Civique (parcs d'Avignon / environnement) est identifiée",
    ],
  },
  // ── 2023 · Histoire — Lettres de poilus ──────────────────────────────────
  {
    id: 'hg_2023_hist_01',
    matiere: 'Histoire-Géographie',
    theme: 'Première Guerre mondiale — source historique',
    annee: 2023,
    source: 'DNB Métropole 2023 — Histoire',
    documents: [
      {
        titre: "Lettres de Félix Delaurat — Archives départementales de l'Allier",
        type: 'texte',
        contenu: `Félix Delaurat, cultivateur dans l'Allier, est mobilisé dès le 2 août 1914. Il entretient avec son épouse Angeline une correspondance suivie jusqu'à son retour en 1919.

Le 4 mai 1916 — Il y a toujours des boches avec des canons. Voilà douze jours que nous sommes là, c'est un vrai enfer. Malgré cela, je suis toujours en bonne santé et on finit par s'habituer à tout.

Le 12 décembre 1916 — La tristesse s'empare de nous tous. Que faisons-nous ici loin de nos familles puisque nos efforts sont nuls ! Nous sommes des martyrs ! Car si la guerre continue dans ces conditions, c'est des assassinats !`,
      },
    ],
    question: "Présentez l'auteur de ces lettres et précisez le contexte historique dans lequel elles ont été écrites.",
    corrige: "Félix Delaurat est un cultivateur de l'Allier mobilisé en août 1914. Ces lettres sont écrites pendant la Première Guerre mondiale (1914-1918), en 1916, l'année de la bataille de Verdun.",
    criteres: [
      "L'auteur est correctement présenté (Félix Delaurat, cultivateur, mobilisé 1914)",
      'Le contexte historique est identifié (1ère Guerre mondiale / 1916)',
    ],
  },
  {
    id: 'hg_2023_hist_02',
    matiere: 'Histoire-Géographie',
    theme: "Première Guerre mondiale — évolution de l'état d'esprit",
    annee: 2023,
    source: 'DNB Métropole 2023 — Histoire',
    documents: [
      {
        titre: "Lettres de Félix Delaurat (1916) — extraits",
        type: 'texte',
        contenu: `Mai 1916 : « on finit par s'habituer à tout. »
Décembre 1916 : « La tristesse s'empare de nous tous. Nous sommes des martyrs ! Car si la guerre continue dans ces conditions, c'est des assassinats ! »`,
      },
    ],
    question: "Montrez que l'état d'esprit de Félix Delaurat change au fil de ses lettres. Utilisez des citations.",
    corrige: "En mai 1916, il garde un certain moral : « on finit par s'habituer à tout ». En décembre 1916, il exprime désespoir et révolte : « tristesse », « martyrs », « assassinats ». L'évolution montre une dégradation progressive du moral.",
    criteres: [
      "L'évolution (positive vers négative) de l'état d'esprit est montrée",
      'Des citations des deux périodes (mai et décembre 1916) sont utilisées',
    ],
  },
  {
    id: 'hg_2023_emc_01',
    matiere: 'EMC',
    theme: 'Citoyenneté — motivations pour voter',
    annee: 2023,
    source: 'DNB Métropole 2023 — EMC',
    documents: [
      {
        titre: 'Article sur les jeunes électeurs (Le Télégramme, avril 2022)',
        type: 'texte',
        contenu: `À Kerfourn, Léo, 18 ans, a voté pour la première fois à la présidentielle. « C'est un droit et un devoir important, ça prouve qu'on existe et qu'on peut décider de l'avenir commun. J'ai lu deux fois les professions de foi de tous les candidats et j'ai fait seul mon choix. »`,
      },
    ],
    question: 'Citez deux motivations qui ont poussé ce jeune citoyen à voter.',
    corrige: "(1) « C'est un droit et un devoir important ». (2) « Ça prouve qu'on existe et qu'on peut décider de l'avenir commun ».",
    criteres: [
      'La première motivation est identifiée (droit et devoir civique)',
      'La seconde motivation est identifiée (participation aux décisions collectives)',
    ],
  },
  {
    id: 'hg_2023_emc_02',
    matiere: 'EMC',
    theme: "Citoyenneté — abstention",
    annee: 2023,
    source: 'DNB Métropole 2023 — EMC',
    question: "Comment appelle-t-on le fait de ne pas aller voter lors d'une élection ?",
    corrige: "On appelle cela l'abstention.",
    criteres: ["La réponse est « l'abstention »"],
  },
  // ── 2022 · Géo — France et UE ────────────────────────────────────────────
  {
    id: 'hg_2022_geo_01',
    matiere: 'Histoire-Géographie',
    theme: "France et Union européenne — Politique de Cohésion",
    annee: 2022,
    source: 'DNB Métropole 2022 — Géographie',
    documents: [
      {
        titre: "La coopération entre les États de l'UE (Éloïse Libourel, 2017)",
        type: 'texte',
        contenu: `La Politique de Cohésion, qui vise à réduire les écarts de développement entre les régions, est la principale politique de l'Union européenne en matière territoriale. L'intégration européenne passe par le développement de la coopération entre les États membres. Cette coopération prend des formes très diverses : en matière de sécurité (Europol) ; en matière d'éducation (programme Erasmus). L'Union européenne promeut surtout la coopération interrégionale, c'est-à-dire l'interaction directe entre régions appartenant à des pays membres différents autour d'un projet commun.`,
      },
    ],
    question: "Quel est l'objectif de la Politique de Cohésion de l'Union européenne ?",
    corrige: "L'objectif est de réduire les écarts de développement entre les régions des États membres de l'UE.",
    criteres: ["La réponse mentionne la réduction des écarts de développement entre les régions"],
  },
  {
    id: 'hg_2022_geo_02',
    matiere: 'Histoire-Géographie',
    theme: "France et UE — échelles de coopération",
    annee: 2022,
    source: 'DNB Métropole 2022 — Géographie',
    documents: [
      {
        titre: "La coopération entre les États de l'UE (extrait)",
        type: 'texte',
        contenu: `Cette coopération prend des formes très diverses. En matière de sécurité, les États coopèrent autour d'accords de police (Europol). En matière d'éducation, c'est notamment le cas du programme Erasmus. L'Union européenne promeut surtout la coopération interrégionale, c'est-à-dire l'interaction directe entre régions appartenant à des pays membres différents autour d'un projet commun.`,
      },
    ],
    question: 'Quelles sont les deux échelles de coopération évoquées dans ce document ?',
    corrige: "(1) La coopération entre États membres (Europol, Erasmus). (2) La coopération interrégionale (entre régions de pays différents).",
    criteres: [
      'La coopération entre États membres est identifiée',
      'La coopération interrégionale est identifiée',
    ],
  },
  {
    id: 'hg_2022_emc_01',
    matiere: 'EMC',
    theme: 'Esprit critique — éducation aux médias',
    annee: 2022,
    source: 'DNB Métropole 2022 — EMC',
    documents: [
      {
        titre: 'Hélène Paumier, professeure de français (Le Monde, 2019)',
        type: 'texte',
        contenu: `C'est en produisant des contenus médiatiques qu'on devient un lecteur, un auditeur, un téléspectateur averti. Qui a fait de la radio une fois ne l'écoute plus jamais de la même oreille : il sait qu'un micro-trottoir est le résultat d'un choix, que l'information se vérifie et se replace dans son contexte.
Et cette leçon s'étend à d'autres situations : elle permet de comprendre qu'on ne doit pas, sur les réseaux sociaux, répercuter sans vérifier, s'indigner sans savoir qui parle.`,
      },
    ],
    question: 'Indiquez deux raisons pour lesquelles une éducation aux médias est nécessaire pour les collégiens.',
    corrige: "(1) Pour devenir un lecteur / auditeur averti, capable d'esprit critique. (2) Pour ne pas diffuser des informations non vérifiées sur les réseaux sociaux.",
    criteres: [
      "La première raison est identifiée (développer l'esprit critique)",
      'La seconde raison est identifiée (vérifier les informations avant de les partager)',
    ],
  },
  {
    id: 'hg_2022_emc_02',
    matiere: 'EMC',
    theme: "Liberté d'expression — limite légale",
    annee: 2022,
    source: 'DNB Métropole 2022 — EMC',
    documents: [
      {
        titre: "Article 11 de la Déclaration des droits de l'Homme et du Citoyen (1789)",
        type: 'texte',
        contenu: `Article 11. La libre communication des pensées et des opinions est un des droits les plus précieux de l'Homme : tout Citoyen peut donc parler, écrire, imprimer librement, sauf à répondre de l'abus de cette liberté dans les cas déterminés par la Loi.`,
      },
    ],
    question: "Nommez la valeur de la République à laquelle fait référence l'article 11 de la DDHC. Par quoi est-elle limitée dans ce même article ?",
    corrige: "L'article 11 fait référence à la liberté d'expression. Elle est limitée par la loi (responsabilité en cas d'abus).",
    criteres: [
      "La valeur identifiée est la liberté (d'expression)",
      "La limite légale est mentionnée (responsabilité / la Loi)",
    ],
  },
  // ── 2021 · Géo — Espaces ruraux ──────────────────────────────────────────
  {
    id: 'hg_2021_geo_01',
    matiere: 'Histoire-Géographie',
    theme: 'Espaces ruraux — difficultés',
    annee: 2021,
    source: 'DNB Métropole 2021 — Géographie',
    documents: [
      {
        titre: 'Le renouveau des territoires ruraux en France (Magali Reghezza-Zitt, 2017)',
        type: 'texte',
        contenu: `Les territoires les plus isolés souffrent d'un déficit de services de plus en plus préoccupant. L'accès aux soins (« désert médical »), à l'éducation, à la culture, à l'administration et même aux services du quotidien est de plus en plus difficile. Autre enjeu majeur, la « fracture numérique », qui désigne les disparités d'accès aux technologies numériques (Internet, téléphonie mobile), renforce l'isolement et donc la fragilité de certains territoires.`,
      },
    ],
    question: 'Relevez deux difficultés que rencontrent les espaces de faible densité en France.',
    corrige: "(1) Déficit de services (déserts médicaux, accès difficile à l'éducation, à la culture). (2) Fracture numérique (inégalités d'accès à Internet et à la téléphonie mobile).",
    criteres: [
      'Une première difficulté est identifiée (déficit de services / désert médical)',
      'Une seconde difficulté est identifiée (fracture numérique)',
    ],
  },
  {
    id: 'hg_2021_geo_02',
    matiere: 'Histoire-Géographie',
    theme: 'Espaces ruraux — tourisme',
    annee: 2021,
    source: 'DNB Métropole 2021 — Géographie',
    documents: [
      {
        titre: 'Territoires ruraux en France (extrait)',
        type: 'texte',
        contenu: `Les territoires ruraux sont désormais considérés comme « espaces de nature et d'authenticité ». Ce renversement des représentations entraîne le développement du « tourisme vert » et se traduit par la multiplication des résidences secondaires et des hébergements en gîtes ruraux ou à la ferme, par la création d'infrastructures légères (sentiers de randonnée, écomusées, etc.). La mise en tourisme permet aussi le maintien ou le développement d'autres activités : artisanat, productions agricoles, etc.`,
      },
    ],
    question: "Expliquez comment l'activité touristique dynamise les territoires ruraux en vous appuyant sur le document.",
    corrige: "Le tourisme vert entraîne la multiplication des hébergements (gîtes, fermes), la création d'infrastructures (sentiers, écomusées) et le maintien d'autres activités économiques (artisanat, agriculture).",
    criteres: [
      "Au moins deux effets du tourisme sur l'économie locale sont mentionnés",
      "La réponse s'appuie sur le document",
    ],
  },
  // ── 2018 · Histoire — La Résistance ──────────────────────────────────────
  {
    id: 'hg_2018_hist_01',
    matiere: 'Histoire-Géographie',
    theme: 'Deuxième Guerre mondiale — Résistance',
    annee: 2018,
    source: 'DNB Métropole 2018 — Histoire',
    documents: [
      {
        titre: 'Témoignage de Jean-Jacques Auduc, enfant résistant (Philippe Chapleau, 2008)',
        type: 'texte',
        contenu: `Jean-Jacques Auduc, né le 9 juillet 1931 (12 ans au moment des faits).

Mon travail était de récupérer les messages. Je venais à bicyclette. Je cachais les messages dans la pompe de mon vélo. On m'envoyait aussi dans les endroits où les adultes ne pouvaient pas aller. Les Allemands avaient positionné sur le terrain d'aviation du Mans trois escadrilles de bombardiers. On m'a envoyé avec un cerf-volant. Les gardes se sont mis à jouer avec moi. À un moment j'ai aperçu que les avions étaient en bois — c'étaient des leurres ! Il n'y avait qu'un enfant qui pouvait s'approcher sans éveiller la méfiance.

En novembre 1943, mes parents ont été arrêtés sur dénonciation.`,
      },
    ],
    question: "Présentez l'auteur de ce témoignage : qui est-il et quel âge avait-il au moment des faits ?",
    corrige: "Jean-Jacques Auduc, né le 9 juillet 1931, était un enfant résistant. Il avait 12 ans au moment des faits (en 1943).",
    criteres: [
      "Le nom de l'auteur est identifié (Jean-Jacques Auduc)",
      "Son âge (12 ans) et sa qualité (enfant résistant) sont mentionnés",
    ],
  },
  {
    id: 'hg_2018_hist_02',
    matiere: 'Histoire-Géographie',
    theme: 'Deuxième Guerre mondiale — Résistance, missions',
    annee: 2018,
    source: 'DNB Métropole 2018 — Histoire',
    documents: [
      {
        titre: 'Témoignage de Jean-Jacques Auduc (extrait)',
        type: 'texte',
        contenu: `Mon travail était de récupérer les messages que je cachais dans la pompe de mon vélo. On m'envoyait aussi dans les endroits où les adultes ne pouvaient pas aller — par exemple pour espionner un terrain d'aviation allemand. Il n'y avait qu'un enfant qui pouvait s'approcher sans éveiller la méfiance des soldats.`,
      },
    ],
    question: "Indiquez les missions confiées à Jean-Jacques Auduc et expliquez pourquoi la Résistance fait appel à lui.",
    corrige: "Missions : (1) agent de liaison (transport de messages cachés dans son vélo) ; (2) agent de renseignement (espionner des installations ennemies). La Résistance fait appel à lui car son jeune âge n'éveille pas la méfiance des soldats allemands.",
    criteres: [
      'Les deux missions sont identifiées (agent de liaison et espionnage/renseignement)',
      "La raison du recours à un enfant est expliquée (n'éveille pas la méfiance)",
    ],
  },
]


// ─────────────────────────────────────────────────────────────────────────────
// SCIENCES — 16 questions (PC + SVT), on pioche 3
// ─────────────────────────────────────────────────────────────────────────────

const SCIENCES_QUESTIONS: FullBankQuestion[] = [
  // ── PC 2026 — Formule 1 ───────────────────────────────────────────────────
  {
    id: 'sci_pc_2026_01',
    matiere: 'Physique-Chimie',
    theme: 'Mouvement — vocabulaire',
    annee: 2026,
    source: 'DNB Métropole 2026 — Physique-Chimie',
    documents: [
      {
        titre: 'Contexte — Formule 1, circuit de Monza',
        type: 'texte',
        contenu: 'Des voitures partent de l\'arrêt complet (point A) et atteignent 330 km/h (point B) sur une ligne droite. Vocabulaire disponible : rectiligne, uniforme, accéléré, circulaire, ralenti.',
      },
    ],
    question: 'Décrivez le mouvement d\'une voiture entre A et B en utilisant les termes : rectiligne, uniforme, accéléré, circulaire, ralenti.',
    corrige: 'Le mouvement est rectiligne accéléré : la voiture se déplace en ligne droite et sa vitesse augmente de 0 à 330 km/h.',
    criteres: [
      'Le mouvement est qualifié de « rectiligne »',
      'Le mouvement est qualifié d\'« accéléré »',
    ],
  },
  {
    id: 'sci_pc_2026_02',
    matiere: 'Physique-Chimie',
    theme: 'Chimie — composition d\'une molécule',
    annee: 2026,
    source: 'DNB Métropole 2026 — Physique-Chimie',
    question: 'La molécule d\'octane a pour formule chimique C8H18. Donnez le nom et le nombre d\'atomes de chaque type.',
    corrige: "La molécule d'octane contient 8 atomes de carbone (C) et 18 atomes d'hydrogène (H), soit 26 atomes au total.",
    criteres: [
      '8 atomes de carbone (C) sont mentionnés',
      '18 atomes d\'hydrogène (H) sont mentionnés',
    ],
  },
  {
    id: 'sci_pc_2026_03',
    matiere: 'Physique-Chimie',
    theme: 'Chimie — combustion et environnement',
    annee: 2026,
    source: 'DNB Métropole 2026 — Physique-Chimie',
    documents: [
      {
        titre: "Équation de la combustion de l'octane",
        type: 'texte',
        contenu: 'octane + dioxygène → dioxyde de carbone + eau',
      },
    ],
    question: "Donnez le nom et la formule chimique du gaz produit lors de la combustion de l'octane qui contribue au réchauffement climatique.",
    corrige: 'Le dioxyde de carbone (CO2).',
    criteres: [
      'Le nom « dioxyde de carbone » est donné',
      'La formule chimique CO2 est donnée',
    ],
  },
  // ── SVT 2026 — SMB chauves-souris ────────────────────────────────────────
  {
    id: 'sci_svt_2026_01',
    matiere: 'Sciences de la vie et de la Terre',
    theme: 'Santé des animaux — parasitisme fongique',
    annee: 2026,
    source: 'DNB Métropole 2026 — SVT',
    documents: [
      {
        titre: 'Caractéristiques du champignon P. destructans',
        type: 'texte',
        contenu: 'P. destructans est un champignon microscopique qui se transmet aux chauves-souris par contacts et se développe sur les parties du corps dépourvues de poils à des températures comprises entre 2 °C et 20 °C.',
      },
      {
        titre: 'Comparaison hibernation saine vs. atteinte du SMB',
        type: 'texte',
        contenu: "Chauve-souris saine : hiberne d'octobre à avril, rares réveils (quelques courts par saison), température corporelle en torpeur ≈ 5 °C, faible consommation d'énergie.\nChauve-souris atteinte du SMB : réveils très fréquents, température remonte à ≈ 37 °C à chaque réveil, consommation d'énergie très accrue. Elle épuise ses réserves avant la fin de l'hibernation et meurt.",
      },
    ],
    question: "Comparez les informations pour indiquer les effets du champignon P. destructans sur les chauves-souris qui hibernent. Des valeurs chiffrées sont attendues.",
    corrige: "La chauve-souris atteinte se réveille bien plus souvent. À chaque réveil sa température remonte à 37 °C (contre ≈ 5 °C en torpeur). Elle consomme ainsi beaucoup plus d'énergie et épuise ses réserves avant la fin de l'hibernation, entraînant sa mort.",
    criteres: [
      'La fréquence accrue des réveils est mentionnée avec valeurs chiffrées',
      "La conséquence (épuisement des réserves / mort) est expliquée",
    ],
  },
  // ── PC 2024 — Piscine olympique ───────────────────────────────────────────
  {
    id: 'sci_pc_2024_01',
    matiere: 'Physique-Chimie',
    theme: 'pH — inconvénients eau acide',
    annee: 2024,
    source: 'DNB Métropole 2024 — Physique-Chimie',
    documents: [
      {
        titre: 'Eau de piscine et pH (CIO)',
        type: 'texte',
        contenu: "Si le pH de l'eau tombe en dessous de 7, le confort des baigneurs n'est plus assuré (irritations de la peau et des yeux) et la durée de vie des équipements notamment métalliques est réduite.",
      },
    ],
    question: "Donnez les deux inconvénients d'une eau de piscine dont le pH est inférieur à 7.",
    corrige: "(1) Irritations de la peau et des yeux des baigneurs. (2) Réduction de la durée de vie des équipements métalliques.",
    criteres: [
      "L'irritation de la peau et/ou des yeux est mentionnée",
      'La dégradation des équipements métalliques est mentionnée',
    ],
  },
  {
    id: 'sci_pc_2024_02',
    matiere: 'Physique-Chimie',
    theme: 'pH — indicateur coloré',
    annee: 2024,
    source: 'DNB Métropole 2024 — Physique-Chimie',
    documents: [
      {
        titre: 'Zones de coloration du rouge de phénol',
        type: 'tableau',
        contenu: "Couleur jaune → pH entre 0 et 6,6 (milieu acide)\nCouleur orange → pH entre 6,6 et 8,4 (proche de la neutralité)\nCouleur rouge → pH entre 8,4 et 14 (milieu basique)",
      },
    ],
    question: "Un test au rouge de phénol donne une couleur rouge. L'eau de la piscine a-t-elle un caractère acide, basique ou neutre ? Justifiez.",
    corrige: "L'eau est basique. Le rouge de phénol est rouge pour des pH compris entre 8,4 et 14, ce qui correspond à un milieu basique (pH > 7).",
    criteres: [
      'Le caractère basique est correctement identifié',
      'La justification fait référence au tableau (pH > 8,4 → rouge → basique)',
    ],
  },
  {
    id: 'sci_pc_2024_03',
    matiere: 'Physique-Chimie',
    theme: 'Chimie — molécule, atome, ion',
    annee: 2024,
    source: 'DNB Métropole 2024 — Physique-Chimie',
    documents: [
      {
        titre: 'Équation de réaction du fer en milieu acide',
        type: 'texte',
        contenu: 'Fe + 2 H+ → Fe2+ + H2',
      },
    ],
    question: "Dans l'équation ci-dessus, citez la formule d'une molécule, celle d'un atome et celle d'un ion.",
    corrige: 'Molécule : H2 (dihydrogène). Atome : Fe (fer). Ion : H+ (ion hydrogène) ou Fe2+ (ion fer II).',
    criteres: [
      'Une molécule est correctement identifiée (H2)',
      'Un atome est correctement identifié (Fe)',
      'Un ion est correctement identifié (H+ ou Fe2+)',
    ],
  },
  // ── SVT 2023 — Phénylcétonurie ───────────────────────────────────────────
  {
    id: 'sci_svt_2023_01',
    matiere: 'Sciences de la vie et de la Terre',
    theme: 'Génétique — maladie génétique et traitement',
    annee: 2023,
    source: 'DNB Métropole 2023 — SVT',
    documents: [
      {
        titre: 'Tableau des traitements selon le taux de phénylalanine (PHE)',
        type: 'tableau',
        contenu: "PHE < 2 mg/dL → dépistage négatif → aucun traitement\n2 < PHE < 10 mg/dL → dépistage positif → suivi médical\nPHE > 10 mg/dL → dépistage positif → régime alimentaire pauvre en PHE et riche en tyrosine + suivi médical",
      },
    ],
    question: "Le patient 2 a un taux de phénylalanine de 19 mg/dL. Citez le traitement qu'il devra suivre et justifiez avec les valeurs chiffrées.",
    corrige: "Le patient 2 a un taux de 19 mg/dL, supérieur à 10 mg/dL. Il devra suivre un régime alimentaire pauvre en phénylalanine et riche en tyrosine, ainsi qu'un suivi médical.",
    criteres: [
      'Le traitement correct est identifié (régime pauvre en PHE, riche en tyrosine + suivi médical)',
      'La justification utilise les valeurs chiffrées (19 mg/dL > 10 mg/dL)',
    ],
  },
  {
    id: 'sci_svt_2023_02',
    matiere: 'Sciences de la vie et de la Terre',
    theme: 'Génétique — phénotype et enzyme',
    annee: 2023,
    source: 'DNB Métropole 2023 — SVT',
    documents: [
      {
        titre: 'Phénylcétonurie et mélanine',
        type: 'texte',
        contenu: "Chez les personnes atteintes de phénylcétonurie, l'enzyme PAH n'est pas fonctionnelle : la phénylalanine ne peut pas être transformée en tyrosine.\nLa mélanine est une molécule produite à partir de la tyrosine. Plus la concentration de mélanine est importante, plus la coloration de la peau, des cheveux et des yeux est foncée.",
      },
    ],
    question: "Expliquez le lien entre la phénylcétonurie et l'aspect très clair de la peau, des cheveux et des yeux d'un patient atteint.",
    corrige: "L'enzyme PAH est non fonctionnelle → la phénylalanine ne peut pas être transformée en tyrosine → pas de tyrosine → pas de mélanine fabriquée → la peau, les cheveux et les yeux sont très clairs.",
    criteres: [
      'La chaîne causale (PAH non fonctionnelle → pas de tyrosine → pas de mélanine) est expliquée',
      'Le lien avec la coloration claire est établi',
    ],
  },
  // ── PC 2023 — GES ─────────────────────────────────────────────────────────
  {
    id: 'sci_pc_2023_01',
    matiere: 'Physique-Chimie',
    theme: 'Chimie — gaz à effet de serre',
    annee: 2023,
    source: 'DNB Métropole 2023 — Physique-Chimie',
    documents: [
      {
        titre: 'Proportion des principaux GES dans l\'atmosphère (GIEC, 2018)',
        type: 'tableau',
        contenu: "CO2 : 0,0408 %\nCH4 : 0,0001857 %\nN2O et autres : ~0,000033 %",
      },
    ],
    question: "Identifiez le gaz à effet de serre le plus abondant dans l'atmosphère en 2018. Donnez le nom et le nombre des atomes de sa molécule.",
    corrige: "Le gaz le plus abondant est le CO2 (dioxyde de carbone) avec 0,0408 %. Une molécule de CO2 contient 1 atome de carbone (C) et 2 atomes d'oxygène (O).",
    criteres: [
      'CO2 (dioxyde de carbone) est identifié comme le plus abondant',
      'La composition atomique est correcte (1 C + 2 O)',
    ],
  },
  {
    id: 'sci_pc_2023_02',
    matiere: 'Physique-Chimie',
    theme: 'Calcul — budget carbone',
    annee: 2023,
    source: 'DNB Métropole 2023 — Physique-Chimie',
    documents: [
      {
        titre: 'Données — Accords de Paris et émissions cumulées de CO2',
        type: 'donnees',
        contenu: "Quantité totale de CO2 émise entre 1850 et 2018 : 2 400 Gt.\nLimite maximale pour rester sous +2 °C (Accords de Paris) : 3 700 Gt.",
      },
    ],
    question: "Calculez la quantité de CO2 que l'humanité peut encore émettre pour rester sous +2 °C.",
    corrige: '3 700 - 2 400 = 1 300 Gt de CO2 restantes.',
    criteres: [
      'La réponse est 1 300 Gt',
      'La soustraction (3 700 - 2 400) est effectuée',
    ],
  },
  // ── SVT 2022 — IST ────────────────────────────────────────────────────────
  {
    id: 'sci_svt_2022_01',
    matiere: 'Sciences de la vie et de la Terre',
    theme: 'Santé — modes de transmission du VIH',
    annee: 2022,
    source: 'DNB Métropole 2022 — SVT',
    documents: [
      {
        titre: 'Modes de transmission des IST (preventionsida.org)',
        type: 'tableau',
        contenu: "VIH : transmis par sperme (risque élevé), sang (risque élevé), sécrétions vaginales (risque élevé) — PAS par la salive.",
      },
    ],
    question: "D'après le document, citez deux liquides biologiques pouvant transmettre le VIH.",
    corrige: "Le VIH peut être transmis par le sperme, le sang et les sécrétions vaginales. Deux de ces trois réponses sont attendues.",
    criteres: [
      'Au moins deux liquides biologiques corrects sont cités (sperme, sang, sécrétions vaginales)',
      'La salive n\'est pas citée comme mode de transmission du VIH',
    ],
  },
  // ── SVT 2021 — Séisme ─────────────────────────────────────────────────────
  {
    id: 'sci_svt_2021_01',
    matiere: 'Sciences de la vie et de la Terre',
    theme: "Géologie — intensité sismique et distance",
    annee: 2021,
    source: 'DNB Métropole 2021 — SVT',
    documents: [
      {
        titre: 'Séisme en Méditerranée (7 juillet 2011)',
        type: 'texte',
        contenu: "Un séisme de magnitude 5,2 est enregistré en Méditerranée. Il a été ressenti sur une distance de 260 km. Son intensité (échelle macrosismique I à XII) est mesurée à différentes distances depuis l'épicentre.",
      },
    ],
    question: "Comment varie l'intensité d'un séisme en fonction de la distance à l'épicentre ?",
    corrige: "L'intensité d'un séisme diminue à mesure que l'on s'éloigne de l'épicentre. Elle est maximale à l'épicentre et devient négligeable au-delà d'une certaine distance.",
    criteres: [
      "L'intensité est dite décroissante avec la distance à l'épicentre",
    ],
  },
  // ── PC 2021 — Isolation thermique ────────────────────────────────────────
  {
    id: 'sci_pc_2021_01',
    matiere: 'Physique-Chimie',
    theme: 'Énergie — isolation thermique',
    annee: 2021,
    source: 'DNB Métropole 2021 — Physique-Chimie',
    documents: [
      {
        titre: 'Conductivité thermique λ (W/m·K) de trois matériaux isolants',
        type: 'tableau',
        contenu: "Laine de verre : λ = 0,035 W/m·K\nOuate de cellulose : λ = 0,042 W/m·K\nPaille : λ = 0,045 W/m·K",
      },
    ],
    question: 'Classez ces trois matériaux du moins isolant au plus isolant. Justifiez votre classement.',
    corrige: 'Du moins isolant au plus isolant : paille (λ = 0,045) → ouate de cellulose (λ = 0,042) → laine de verre (λ = 0,035). Plus la conductivité thermique λ est faible, meilleur est l\'isolant.',
    criteres: [
      'Le classement est correct (paille → ouate de cellulose → laine de verre)',
      'La justification explique que plus λ est petit, meilleur est l\'isolant',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SUJETS DE RÉDACTION — 10 sujets, on pioche 1
// ─────────────────────────────────────────────────────────────────────────────

export const REDACTION_SUBJECTS: RedactionSubject[] = [
  {
    id: 'red_2026_refl',
    annee: 2026,
    type: 'reflexion',
    texteSupport: 'Pantoum Patate — Paul Fournel (2015)',
    consigne: "Selon vous, la poésie, la littérature et l'art ont-ils pour mission d'embellir le réel ? Présentez votre réflexion dans un développement argumenté et organisé. Illustrez votre propos à l'aide d'exemples issus de vos lectures et de votre culture artistique personnelle. Rédigez en une trentaine de lignes au moins.",
  },
  {
    id: 'red_2026_ima',
    annee: 2026,
    type: 'imagination',
    texteSupport: 'Pantoum Patate — Paul Fournel (2015)',
    consigne: "À votre tour, choisissez un aliment auquel vous vous adressez directement pour révéler ses qualités. Vous rédigerez ce texte dans une langue poétique, attentive aux images, aux effets de rythme et de sonorité. Rédigez en 35 lignes au moins.",
  },
  {
    id: 'red_2025_ima',
    annee: 2025,
    type: 'imagination',
    texteSupport: "La Force de l'âge — Simone de Beauvoir (1960)",
    contexte: 'La narratrice, Simone, vient d\'arriver seule à Marseille pour y travailler comme professeure de lycée.',
    consigne: "Quelque temps plus tard, la narratrice écrit une lettre à ses parents dans laquelle elle raconte les jours qui ont suivi son arrivée dans la ville. Vous décrirez les expériences vécues, les lieux explorés, les personnes rencontrées et exprimerez les impressions que lui procurent ces découvertes.",
  },
  {
    id: 'red_2025_refl',
    annee: 2025,
    type: 'reflexion',
    texteSupport: "La Force de l'âge — Simone de Beauvoir (1960)",
    consigne: "Pensez-vous que la littérature et les arts en général permettent aux lecteurs et aux spectateurs de découvrir des lieux, réels ou fictifs, comme s'ils y étaient ? Présentez votre réflexion dans un développement argumenté et organisé, illustré d'exemples issus de vos lectures et de votre culture artistique personnelle.",
  },
  {
    id: 'red_2024_ima',
    annee: 2024,
    type: 'imagination',
    texteSupport: 'La chambre des officiers — Marc Dugain (1999)',
    contexte: "Marguerite est une jeune femme courageuse qui s'est engagée comme infirmière volontaire durant la Première Guerre mondiale.",
    consigne: "Imaginez la suite du récit de Marguerite, du point de vue de la jeune femme, en utilisant la première personne et en terminant par l'accident qui a causé ses blessures. Vous mêlerez narration et description.\n\nVous commencerez ainsi : « Me voilà désormais sur le front. Je ne ressentais pas la peur, je n'en avais pas le temps. »",
  },
  {
    id: 'red_2024_refl',
    annee: 2024,
    type: 'reflexion',
    texteSupport: 'La chambre des officiers — Marc Dugain (1999)',
    consigne: "Que peuvent apporter les récits de vie, réels ou fictifs, à celles et ceux qui les découvrent ? Présentez votre réflexion dans un développement argumenté et organisé, illustré d'exemples issus de vos lectures et de votre culture artistique personnelle.",
  },
  {
    id: 'red_2023_ima',
    annee: 2023,
    type: 'imagination',
    texteSupport: 'Histoire de ma vie — George Sand (1855)',
    consigne: "Il vous est arrivé d'être pris dans un jeu qui vous a entraîné progressivement dans une aventure imaginaire intense. Vous raconterez cet épisode à la première personne. Vous pourrez enrichir votre récit par des descriptions, l'expression des sentiments et des sensations.",
  },
  {
    id: 'red_2023_refl',
    annee: 2023,
    type: 'reflexion',
    texteSupport: 'Histoire de ma vie — George Sand (1855)',
    consigne: "Pourquoi parle-t-on de soi et raconte-t-on sa vie dans des œuvres autobiographiques ? Vous répondrez à cette question dans un développement argumenté. Pour illustrer vos arguments, vous vous appuierez sur des exemples précis tirés d'œuvres littéraires et artistiques.",
  },
  {
    id: 'red_2022_refl',
    annee: 2022,
    type: 'reflexion',
    consigne: "La littérature et les œuvres artistiques peuvent-elles nous aider à réfléchir sur notre propre comportement ? Vous répondrez à cette question dans un développement organisé, en vous appuyant sur des exemples pris dans les œuvres littéraires et artistiques que vous connaissez.",
  },
  {
    id: 'red_2021_refl',
    annee: 2021,
    type: 'reflexion',
    consigne: "Aimez-vous découvrir des œuvres littéraires et artistiques dans lesquelles interviennent le surnaturel ou l'étrange ? Vous répondrez à cette question par un développement argumenté en vous appuyant sur les œuvres étudiées en classe, vos lectures personnelles et les œuvres cinématographiques et artistiques que vous connaissez.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Index serveur (corrigé + critères disponibles, jamais exposé au client)
// ─────────────────────────────────────────────────────────────────────────────

const ALL_QUESTIONS: FullBankQuestion[] = [
  ...MATHS_QUESTIONS,
  ...FRANCAIS_QUESTIONS,
  ...HG_QUESTIONS,
  ...SCIENCES_QUESTIONS,
]

export const QUESTIONS_INDEX = new Map<string, FullBankQuestion>(
  ALL_QUESTIONS.map(q => [q.id, q])
)

export const REDACTION_INDEX = new Map<string, RedactionSubject>(
  REDACTION_SUBJECTS.map(r => [r.id, r])
)

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function toStored(q: FullBankQuestion): StoredQuestion {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { corrige, criteres, ...stored } = q
  return stored
}

/**
 * Pioche 5 Français + 6 HG/EMC + 3 Maths + 3 Sciences = 17 questions ouvertes
 * + 1 sujet de rédaction.
 * Les corrigés et critères sont retirés avant le retour.
 */
export function pickRandomQuestions(): {
  questions: StoredQuestion[]
  redaction: RedactionSubject
} {
  const fr   = shuffle(FRANCAIS_QUESTIONS).slice(0, 5).map(toStored)
  const hg   = shuffle(HG_QUESTIONS).slice(0, 6).map(toStored)
  const math = shuffle(MATHS_QUESTIONS).slice(0, 3).map(toStored)
  const sci  = shuffle(SCIENCES_QUESTIONS).slice(0, 3).map(toStored)
  const redaction = shuffle(REDACTION_SUBJECTS)[0]

  return {
    questions: [...fr, ...hg, ...math, ...sci],
    redaction,
  }
}

/** Récupère une question complète (avec corrigé) côté serveur uniquement. */
export function getFullQuestion(id: string): FullBankQuestion | undefined {
  return QUESTIONS_INDEX.get(id)
}

/** Récupère un sujet de rédaction par son id. */
export function getRedactionById(id: string): RedactionSubject | undefined {
  return REDACTION_INDEX.get(id)
}
