// lib/brevet/questions-bank.ts
// Banque de questions officielles du DNB – série générale
// Sources : Sujet Zéro Maths A & B (MEN), Français 2018 (grammaire + compréhension)
// Format : QCM 4 options, 1 bonne réponse (indice 0-3)

export interface BankQuestion {
  matiere: 'Mathématiques' | 'Français'
  theme: string
  question: string
  options: [string, string, string, string]
  correct: 0 | 1 | 2 | 3
}

export const QUESTIONS_BANK: BankQuestion[] = [

  // ─── MATHÉMATIQUES ─ Calcul numérique ────────────────────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Calcul numérique',
    question: 'Quel est le tiers de 18 ?',
    options: ['3', '6', '9', '54'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Calcul numérique',
    question: 'Un film dure 240 minutes. Quelle est sa durée en heures ?',
    options: ['2 h', '3 h', '4 h', '5 h'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Calcul numérique',
    question: 'Quel est le résultat de 7 × 8 − 12 ÷ 4 ?',
    options: ['47', '53', '56', '61'],
    correct: 0,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Calcul numérique',
    question: 'Quelle est la valeur de 2³ + 3² ?',
    options: ['13', '17', '25', '30'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Calcul numérique',
    question: 'Quelle fraction est égale à 0,75 ?',
    options: ['1/4', '2/3', '3/4', '4/5'],
    correct: 2,
  },

  // ─── MATHÉMATIQUES ─ Statistiques ────────────────────────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Statistiques',
    question: 'Les notes d\'un élève sont 8, 12, 6, 19, 15. Quelle est la médiane ?',
    options: ['8', '10', '12', '15'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Statistiques',
    question: 'Une série de notes est : 8, 10, 11, 11. Quelle est la moyenne ?',
    options: ['9,5', '10', '10,5', '11'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Statistiques',
    question: 'Un collège relève les déchets alimentaires (kg) sur 7 semaines : 62, 59, 74, 68, 55, 61, 71. Quelle est la moyenne hebdomadaire (arrondie à l\'unité) ?',
    options: ['63 kg', '64 kg', '65 kg', '66 kg'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Statistiques',
    question: 'Dans une série ordonnée de 7 valeurs, quelle est la position de la médiane ?',
    options: ['La 2e valeur', 'La 3e valeur', 'La 4e valeur', 'La 6e valeur'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Statistiques',
    question: 'La moyenne de 5 valeurs est 12. Quelle est leur somme ?',
    options: ['17', '50', '60', '72'],
    correct: 2,
  },

  // ─── MATHÉMATIQUES ─ Pourcentages & proportionnalité ─────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Pourcentages',
    question: 'Dans un collège de 800 élèves, 25 % portent des lunettes. Combien d\'élèves portent des lunettes ?',
    options: ['150', '200', '250', '300'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Pourcentages',
    question: 'Dans un collège, 25 % des 300 élèves participent à une olympiade de maths. Combien n\'y participent PAS ?',
    options: ['75', '150', '225', '275'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Pourcentages',
    question: 'Un article coûte 80 € et bénéficie d\'une remise de 15 %. Quel est le prix après remise ?',
    options: ['65 €', '68 €', '72 €', '76 €'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Proportionnalité',
    question: 'Une voiture roule à 90 km/h. Combien de temps met-elle pour parcourir 45 km ?',
    options: ['15 min', '30 min', '45 min', '1 h'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Proportionnalité',
    question: 'Un cycliste parcourt 36 km en 1 h 30 min. Quelle est sa vitesse moyenne en km/h ?',
    options: ['18 km/h', '24 km/h', '27 km/h', '36 km/h'],
    correct: 1,
  },

  // ─── MATHÉMATIQUES ─ Géométrie ───────────────────────────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'Quelle est la mesure, en degrés, d\'un angle droit ?',
    options: ['45°', '60°', '90°', '180°'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'La somme des angles d\'un triangle est égale à :',
    options: ['90°', '180°', '270°', '360°'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'Dans un triangle ABC rectangle en B, l\'angle A mesure 35°. Quelle est la mesure de l\'angle C ?',
    options: ['35°', '45°', '55°', '65°'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'Un losange a un côté de 5 cm. Quel est son périmètre ?',
    options: ['10 cm', '15 cm', '20 cm', '25 cm'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'Quelle formule donne l\'aire d\'un disque de rayon r ?',
    options: ['2πr', 'πr²', '2πr²', 'πr'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'Dans un triangle rectangle, l\'hypoténuse est :',
    options: ['Le plus petit côté', 'Un côté adjacent à l\'angle droit', 'Le côté opposé à l\'angle droit', 'N\'importe quel côté'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'Le théorème de Pythagore : dans un triangle rectangle de côtés a, b (autour de l\'angle droit) et c (hypoténuse), on a :',
    options: ['a + b = c', 'a² + b² = c²', 'a × b = c²', '(a + b)² = c'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Géométrie',
    question: 'Dans un triangle ABC rectangle en A, le cosinus de l\'angle B est égal à :',
    options: ['AB / BC', 'AC / BC', 'AB / AC', 'BC / AB'],
    correct: 0,
  },

  // ─── MATHÉMATIQUES ─ Probabilités ────────────────────────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Probabilités',
    question: 'Une urne contient 21 jetons numérotés de 1 à 21. On tire un jeton. Quelle est la probabilité d\'obtenir 2, 3 ou 10 ?',
    options: ['1/21', '2/21', '3/21', '4/21'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Probabilités',
    question: 'On lance un dé à 6 faces numérotées de 1 à 6. Quelle est la probabilité d\'obtenir un nombre pair ?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Probabilités',
    question: 'On tire au hasard une carte dans un jeu de 52 cartes. Quelle est la probabilité d\'obtenir un as ?',
    options: ['1/52', '1/13', '1/4', '4/52'],
    correct: 1,
  },

  // ─── MATHÉMATIQUES ─ Fonctions ───────────────────────────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Fonctions',
    question: 'On considère la fonction f : x ↦ 4x + 3. Quelle est la valeur de f(2) ?',
    options: ['9', '11', '14', '16'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Fonctions',
    question: 'La fonction g : x ↦ 6x. Pour quelle valeur de x a-t-on g(x) = 4x + 3 ?',
    options: ['x = 1', 'x = 1,5', 'x = 2', 'x = 3'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Fonctions',
    question: 'Un paquet vide pèse 200 g. On y ajoute de la lessive à 1,5 g/cm³. La masse totale f(x) pour un volume x cm³ de lessive est :',
    options: ['f(x) = 200x + 1,5', 'f(x) = 1,5x + 200', 'f(x) = 200 ÷ 1,5x', 'f(x) = 1,5x − 200'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Fonctions',
    question: 'Pour résoudre l\'équation 4x − 3 = 20, on effectue le calcul :',
    options: ['x = 20/4 + 3', 'x = (20 − 4) + 3', 'x = (20 + 3) / 4', 'x = 20 × 4 + 3'],
    correct: 2,
  },

  // ─── MATHÉMATIQUES ─ Algèbre & développement ─────────────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Calcul algébrique',
    question: 'Un programme de calcul prend un nombre x, le double, ajoute 3, puis élève au carré. Pour x = 1, quel est le résultat ?',
    options: ['7', '10', '25', '55'],
    correct: 2,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Calcul algébrique',
    question: 'Parmi les expressions suivantes, laquelle est égale à (2x − 3)(2x + 3) ?',
    options: ['4x² − 9', '4x² + 9', '4x² − 12x + 9', '(2x)² − 6'],
    correct: 0,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Calcul algébrique',
    question: 'Développer et réduire (x + 5)² :',
    options: ['x² + 5', 'x² + 10x + 25', 'x² + 25', '2x + 10'],
    correct: 1,
  },

  // ─── MATHÉMATIQUES ─ Algorithme & programmation ──────────────────────────────

  {
    matiere: 'Mathématiques',
    theme: 'Algorithmique',
    question: 'Un algorithme prend un entier n et affiche « Pair » si n est divisible par 2, sinon « Impair ». Pour n = 7, que s\'affiche-t-il ?',
    options: ['Pair', 'Impair', '7', 'Rien'],
    correct: 1,
  },
  {
    matiere: 'Mathématiques',
    theme: 'Algorithmique',
    question: 'On veut dessiner un carré avec un logiciel de programmation en répétant 4 fois : avancer de d puis tourner à droite. De combien degrés faut-il tourner à chaque fois ?',
    options: ['45°', '60°', '90°', '120°'],
    correct: 2,
  },

  // ─── FRANÇAIS ─ Grammaire ─────────────────────────────────────────────────────

  {
    matiere: 'Français',
    theme: 'Grammaire',
    question: 'Dans « Je pense qu\'il viendra », la proposition soulignée est :',
    options: [
      'Une proposition subordonnée relative',
      'Une proposition subordonnée complétive',
      'Une proposition indépendante',
      'Une proposition principale',
    ],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Grammaire',
    question: 'Dans « Le livre que j\'ai lu est passionnant », la proposition soulignée est :',
    options: [
      'Une proposition subordonnée relative',
      'Une proposition subordonnée complétive',
      'Une proposition circonstancielle de cause',
      'Une proposition indépendante',
    ],
    correct: 0,
  },
  {
    matiere: 'Français',
    theme: 'Grammaire',
    question: 'Quelle est la nature du mot « rapidement » dans « Il court rapidement » ?',
    options: ['Adjectif qualificatif', 'Adverbe', 'Nom commun', 'Pronom'],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Grammaire',
    question: 'Quel est le sujet du verbe dans « Les enfants jouent dans le jardin » ?',
    options: ['Les enfants', 'jouent', 'dans le jardin', 'le jardin'],
    correct: 0,
  },
  {
    matiere: 'Français',
    theme: 'Grammaire',
    question: 'Dans « La maison dont je rêve », le mot « dont » est :',
    options: ['Une conjonction de coordination', 'Un pronom relatif', 'Un pronom démonstratif', 'Un adverbe'],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Grammaire',
    question: 'Laquelle de ces phrases contient un COD (complément d\'objet direct) ?',
    options: [
      'Il pense à ses amis.',
      'Elle mange une pomme.',
      'Nous allons à Paris.',
      'Tu ressembles à ton père.',
    ],
    correct: 1,
  },

  // ─── FRANÇAIS ─ Discours direct / indirect ───────────────────────────────────

  {
    matiere: 'Français',
    theme: 'Discours direct et indirect',
    question: 'Transformez en discours indirect : Paul dit : « Je suis fatigué. »',
    options: [
      'Paul dit qu\'il est fatigué.',
      'Paul dit que je suis fatigué.',
      'Paul dit : il est fatigué.',
      'Paul dit qu\'il était fatigué.',
    ],
    correct: 0,
  },
  {
    matiere: 'Français',
    theme: 'Discours direct et indirect',
    question: 'Quelle phrase est au discours direct ?',
    options: [
      'Elle a dit qu\'elle viendrait.',
      '« Viens ici ! » cria-t-il.',
      'Il lui a demandé de partir.',
      'Il pensait qu\'il avait raison.',
    ],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Discours direct et indirect',
    question: 'Le professeur a demandé si les élèves avaient compris. Quelle est la forme directe ?',
    options: [
      'Le professeur a dit : « Les élèves ont-ils compris ? »',
      'Le professeur a dit : « Avez-vous compris ? »',
      'Le professeur a dit : « Vous comprenez ? »',
      'Le professeur a dit : « Ils ont compris. »',
    ],
    correct: 1,
  },

  // ─── FRANÇAIS ─ Conjugaison ───────────────────────────────────────────────────

  {
    matiere: 'Français',
    theme: 'Conjugaison',
    question: 'Quel est le temps de « il aurait vu » ?',
    options: ['Passé composé', 'Plus-que-parfait', 'Conditionnel passé', 'Subjonctif imparfait'],
    correct: 2,
  },
  {
    matiere: 'Français',
    theme: 'Conjugaison',
    question: 'Conjuguez « aller » à la 1re personne du singulier du futur simple :',
    options: ['je vas', 'j\'irai', 'j\'allais', 'j\'aille'],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Conjugaison',
    question: 'Quel est le mode de « Que tu viennes » ?',
    options: ['Indicatif', 'Conditionnel', 'Subjonctif', 'Impératif'],
    correct: 2,
  },
  {
    matiere: 'Français',
    theme: 'Conjugaison',
    question: 'Quel est le participe passé du verbe « naître » ?',
    options: ['naîtu', 'nait', 'né', 'naissant'],
    correct: 2,
  },

  // ─── FRANÇAIS ─ Vocabulaire & sens ───────────────────────────────────────────

  {
    matiere: 'Français',
    theme: 'Vocabulaire',
    question: 'Quel est le synonyme de « soupçonneux » (cf. Marcel Aymé, Uranus, 1948) ?',
    options: ['Méfiant', 'Attentif', 'Bienveillant', 'Indifférent'],
    correct: 0,
  },
  {
    matiere: 'Français',
    theme: 'Vocabulaire',
    question: 'Quel est l\'antonyme (contraire) du mot « rancune » ?',
    options: ['Colère', 'Indulgence', 'Jalousie', 'Méfiance'],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Vocabulaire',
    question: 'Dans « Léopold était devenu le plus attentif des élèves », que signifie « attentif » ?',
    options: ['Distrait', 'Concentré et vigilant', 'Hostile', 'Fatigué'],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Vocabulaire',
    question: 'Un mot « péjoratif » donne une image :',
    options: ['Positive', 'Neutre', 'Négative', 'Ambiguë'],
    correct: 2,
  },

  // ─── FRANÇAIS ─ Compréhension de texte ───────────────────────────────────────

  {
    matiere: 'Français',
    theme: 'Compréhension',
    question: 'Dans un texte narratif, qui est généralement le narrateur à la 1re personne ?',
    options: [
      'L\'auteur lui-même',
      'Un personnage de l\'histoire',
      'Le lecteur',
      'Un observateur extérieur neutre',
    ],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Compréhension',
    question: 'Un texte « argumentatif » a pour but principal de :',
    options: [
      'Raconter une histoire',
      'Décrire un lieu',
      'Convaincre le lecteur d\'un point de vue',
      'Expliquer un phénomène scientifique',
    ],
    correct: 2,
  },
  {
    matiere: 'Français',
    theme: 'Compréhension',
    question: 'Quel procédé littéraire consiste à comparer deux éléments avec un outil de comparaison (« comme », « tel ») ?',
    options: ['La métaphore', 'La comparaison', 'La personnification', 'L\'hyperbole'],
    correct: 1,
  },
  {
    matiere: 'Français',
    theme: 'Compréhension',
    question: 'Dans « La nuit déployait son manteau de velours étoilé », quel procédé est utilisé ?',
    options: ['Une comparaison', 'Une métaphore', 'Une hyperbole', 'Une anaphore'],
    correct: 1,
  },

  // ─── FRANÇAIS ─ Orthographe ───────────────────────────────────────────────────

  {
    matiere: 'Français',
    theme: 'Orthographe',
    question: 'Quelle est l\'orthographe correcte ?',
    options: ['ces enfants sont gentils', 'se enfants sont gentil', 'ces enfants sont gentilles', 'ses enfants sont gentil'],
    correct: 0,
  },
  {
    matiere: 'Français',
    theme: 'Orthographe',
    question: 'Lequel de ces mots prend un accent circonflexe sur le « u » ?',
    options: ['du', 'sur', 'dû', 'sous'],
    correct: 2,
  },
  {
    matiere: 'Français',
    theme: 'Orthographe',
    question: 'Comment accorde-t-on l\'adjectif dans « des roses blanches » ?',
    options: ['blanc', 'blanche', 'blanches', 'blancs'],
    correct: 2,
  },
]

/**
 * Retourne n questions aléatoires en respectant un équilibre maths/français.
 * Sur 20 questions : environ 12 maths + 8 français (ratio du brevet).
 */
export function pickRandomQuestions(count = 20): BankQuestion[] {
  const maths = QUESTIONS_BANK.filter(q => q.matiere === 'Mathématiques')
  const francais = QUESTIONS_BANK.filter(q => q.matiere === 'Français')

  const mathCount = Math.round(count * 0.6)
  const frCount = count - mathCount

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const picked = [
    ...shuffle(maths).slice(0, mathCount),
    ...shuffle(francais).slice(0, frCount),
  ]

  return shuffle(picked)
}
