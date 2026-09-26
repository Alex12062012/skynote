/**
 * SKYNOTE - Prompts IA
 * Tous les prompts utilises pour la generation de fiches et QCM
 * Les fiches et QCM sont generes dans la langue du contenu du cours
 */

export const CONTENT_LANGUAGES: { code: string; label: string }[] = [
  { code: 'auto', label: 'Auto (langue du cours)' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]

export function getFlashcardSystemPrompt(lang?: string): string {
  const langRule = (!lang || lang === 'auto')
    ? `REGLE DE LANGUE CRUCIALE :
- DETECTE automatiquement la langue du contenu du cours fourni.
- Genere les fiches DANS LA MEME LANGUE que le contenu du cours.`
    : `REGLE DE LANGUE CRUCIALE :
- Genere les fiches OBLIGATOIREMENT en : ${CONTENT_LANGUAGES.find(l => l.code === lang)?.label ?? lang}.
- Peu importe la langue du cours source, les fiches doivent etre dans cette langue.`

  return `Tu es un assistant pedagogique pour eleves de college et lycee (10-17 ans).
Tu transformes un cours en fiches de revision.

${langRule}

CONTRAINTES STRICTES - toute violation rend la reponse invalide :
1. Reponds UNIQUEMENT en JSON valide. Pas de markdown, pas de backticks, pas de texte avant ou apres le JSON.
2. Le JSON contient UN SEUL tableau "flashcards" avec ENTRE 3 ET 4 fiches. JAMAIS plus de 4, JAMAIS moins de 3. Si le cours couvre plus de 4 sous-themes, regroupe les plus proches ensemble plutot que d'ajouter une 5e fiche.
3. Chaque fiche couvre un sous-theme DISTINCT. AUCUN doublon de titre ou de contenu. Si deux fiches se ressemblent, fusionne-les.
4. Chaque fiche a EXACTEMENT 3 points essentiels (key_points). Pas 2, pas 4, pas 5.
5. Le resume fait 2 phrases maximum.
6. Les titres sont courts (3-6 mots).
7. Langage simple, direct, niveau college/lycee.

FORMAT JSON EXACT :
{
  "flashcards": [
    {
      "title": "Titre court (3-6 mots)",
      "summary": "Resume en 1-2 phrases claires.",
      "key_points": [
        "Point essentiel 1",
        "Point essentiel 2",
        "Point essentiel 3"
      ]
    }
  ]
}

RAPPEL : ENTRE 3 ET 4 fiches, jamais plus, jamais moins. 3 key_points par fiche, pas plus. Aucun doublon. TOUT DANS LA LANGUE SPECIFIEE.`
}

/**
 * Source unique de verite pour les niveaux QCM (les autres modules re-exportent ce type).
 * Le niveau 'hard' ("Teste tes parents") a ete supprime — migration 034.
 */
export type QcmDifficulty = 'peaceful' | 'easy' | 'medium'

export const QCM_DIFFICULTIES: readonly QcmDifficulty[] = ['peaceful', 'easy', 'medium']

/** Nombre de questions conservees par fiche et par niveau. */
export const QCM_QUESTIONS_PER_FLASHCARD = 5

/**
 * Nombre de questions DEMANDEES au modele : une de plus que necessaire.
 * Mesure en prod : le modele laisse souvent 1 question biaisee (bonne reponse
 * trop longue) par fiche ; avec exactement 5, la fiche devenait invalide et
 * declenchait un second appel. Avec 6, la validation en garde 5 sans retry.
 */
export const QCM_QUESTIONS_REQUESTED = QCM_QUESTIONS_PER_FLASHCARD + 1

export function isQcmDifficulty(value: unknown): value is QcmDifficulty {
  return typeof value === 'string' && (QCM_DIFFICULTIES as readonly string[]).includes(value)
}

/**
 * Anti-biais de longueur (niveaux Normal et Hardcore uniquement).
 * Sans cette regle, la bonne reponse est presque toujours la plus longue et la
 * plus detaillee des 4 options : l'eleve la repere sans lire la question.
 *
 * L'ancienne formulation demandait d'ENRICHIR un distracteur avec une fausse
 * justification pour l'aligner sur la bonne reponse. Meme objectif, mais elle
 * gonflait la sortie : mesure du 26/09, le niveau Hardcore depassait les
 * 3 900 tokens de max_tokens et le JSON etait tronque (2 fiches sur 12 dans le
 * benchmark, et la cause n°1 des niveaux incomplets en prod). On demande
 * maintenant l'inverse : 4 options COURTES et de longueur comparable.
 */
const QCM_LENGTH_BALANCE_RULE = `- REGLE ANTI-BIAIS DE LONGUEUR (obligatoire) : les 4 options doivent avoir une longueur COMPARABLE (ecart de 30 % maximum en nombre de mots) et rester COURTES : 12 mots maximum chacune. La bonne reponse ne doit JAMAIS etre reconnaissable parce qu'elle est plus longue ou plus detaillee que les autres.
  Varie la position (index) de la bonne reponse d'une question a l'autre.`

const QCM_DIFFICULTY_INSTRUCTIONS: Record<QcmDifficulty, string> = {
  peaceful: `NIVEAU PAISIBLE (tres facile) :
- Questions ultra-directes sur les definitions et faits principaux de la fiche.
- Les mauvaises reponses sont clairement et evidemment differentes de la bonne.
- ZERO piege, ZERO nuance subtile, ZERO connaissance hors-fiche.
- Formulations tres simples, une seule idee par question.
- L'eleve qui a lu la fiche une seule fois doit pouvoir repondre facilement.
- Varie la position (index) de la bonne reponse d'une question a l'autre.`,

  easy: `NIVEAU NORMAL :
- Questions directes sur les definitions et faits principaux de la fiche.
- Les mauvaises reponses sont plausibles mais identifiables avec un peu de reflexion.
- Quelques pieges simples (formulations proches, inversions de details).
- Formulations claires, niveau college.
- Reste STRICTEMENT dans le perimetre de la fiche : aucune notion hors-programme, aucune connaissance que la fiche ne contient pas.
- L'eleve qui a bien lu sa fiche doit obtenir un bon score.
${QCM_LENGTH_BALANCE_RULE}`,

  medium: `NIVEAU HARDCORE :
- Questions de comprehension avancee : l'eleve doit avoir vraiment compris, pas juste memorise.
- Les mauvaises reponses sont tres plausibles et proches de la bonne reponse.
- Inclure des questions d'application, de comparaison, et quelques pieges subtils.
- Ajouter 1 ou 2 questions de culture generale directement liees au sujet de la fiche (pas hors-sujet).
- Formulations qui demandent de reflechir et de croiser les informations.
- La difficulte doit venir de la subtilite sur le contenu REELLEMENT enseigne dans CETTE fiche, jamais d'un saut vers des notions techniques plus avancees non couvertes par le cours. Exemple a ne PAS faire : une fiche de base sur les entrees/sorties d'un ordinateur ne doit pas amener une question sur l'ALU ou le codage binaire. Une question hors-programme n'est pas "difficile", elle est injuste.
${QCM_LENGTH_BALANCE_RULE}`,
}

/**
 * Prompt systeme QCM — UNE fiche par appel.
 *
 * L'ancienne version annonçait le format `{"questions": [...]}` alors que le
 * prompt utilisateur demandait `{"fiches": [{title, questions}]}` : deux
 * formats contradictoires dans le meme appel. Un seul format desormais, et
 * plus de wrapper `fiches` inutile puisqu'un appel = une fiche.
 */
export function getQcmSystemPrompt(
  difficulty: QcmDifficulty = 'easy',
  requested: number = QCM_QUESTIONS_REQUESTED
): string {
  return `Tu es un assistant pedagogique qui cree des QCM pour des eleves de college et lycee.

${QCM_DIFFICULTY_INSTRUCTIONS[difficulty]}

CONTRAINTES STRICTES :
1. Reponds UNIQUEMENT en JSON valide. Rien avant, rien apres, pas de backticks.
2. Genere EXACTEMENT ${requested} questions.
3. Chaque question a EXACTEMENT 4 options (options[0] a options[3]).
4. correct_index est l'index (0-3) de la bonne reponse.
5. explanation : UNE phrase courte, 20 mots maximum.
6. Les questions sont dans la langue de la fiche.

FORMAT JSON EXACT :
{"questions":[{"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}]}`
}

/** Prompt utilisateur QCM : le contenu de la fiche, rien de plus. */
export function buildQcmPrompt(fiche: { title: string; summary: string; key_points: string[] }): string {
  return `FICHE : ${fiche.title}
Resume : ${fiche.summary}
Points cles : ${fiche.key_points.join(' ; ')}`
}

export function buildFlashcardPrompt(courseTitle: string, subject: string, content: string): string {
  return `MATIERE : ${subject}
TITRE DU COURS : ${courseTitle}

CONTENU DU COURS :
${content}`
}
