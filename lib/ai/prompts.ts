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
2. Le JSON contient UN SEUL tableau "flashcards" avec IDEALEMENT 4 fiches. Si le cours est tres dense et couvre beaucoup de sous-themes distincts, tu peux aller jusqu'a 6 fiches maximum. Jamais plus de 6, jamais moins de 3.
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

RAPPEL : Idealement 4 fiches, jusqu'a 6 si vraiment necessaire. 3 key_points par fiche, pas plus. Aucun doublon. TOUT DANS LA LANGUE SPECIFIEE.`
}

// Compat : sans lang = auto-detect
export const FLASHCARD_SYSTEM_PROMPT = getFlashcardSystemPrompt()

export type QcmDifficulty = 'peaceful' | 'easy' | 'medium' | 'hard'

const QCM_DIFFICULTY_INSTRUCTIONS: Record<QcmDifficulty, string> = {
  peaceful: `NIVEAU PAISIBLE (tres facile) :
- Questions ultra-directes sur les definitions et faits principaux du cours.
- Les mauvaises reponses sont clairement et evidemment differentes de la bonne.
- ZERO piege, ZERO nuance subtile, ZERO connaissance hors-cours.
- Formulations tres simples, une seule idee par question.
- L'eleve qui a lu la fiche une seule fois doit pouvoir repondre facilement.`,

  easy: `NIVEAU NORMAL :
- Questions directes sur les definitions et faits principaux du cours.
- Les mauvaises reponses sont plausibles mais clairement identifiables avec un peu de reflexion.
- Quelques pièges simples (formulations proches, inversions de details).
- Formulations claires, niveau college.
- L'eleve qui a bien lu sa fiche doit obtenir un bon score.`,

  medium: `NIVEAU HARDCORE :
- Questions de comprehension avancee : l'eleve doit avoir vraiment compris, pas juste memorise.
- Les mauvaises reponses sont tres plausibles et proches de la bonne reponse.
- Inclure des questions d'application, de comparaison, et quelques pièges subtils.
- Ajouter 1 ou 2 questions avec des connaissances complementaires liees au sujet (pas hors-sujet).
- Formulations qui demandent de reflechir et de croiser les informations.`,

  hard: `NIVEAU TESTE TES PARENTS :
- Questions tres avancees : analyse, cas concrets, pièges subtils, nuances importantes.
- Les mauvaises reponses sont extremement plausibles, seule la maitrise totale permet de les distinguer.
- Inclure des "lequel n'est PAS...", des cas limites, des contradictions apparentes.
- Ajouter des connaissances supplementaires liees au sujet (culture generale du domaine).
- Niveau tel qu'un adulte sans connaissance du sujet aurait du mal a repondre.`,
}

export function getQcmSystemPrompt(difficulty: QcmDifficulty = 'easy'): string {
  return `Tu es un assistant pedagogique qui cree des QCM pour des eleves de college et lycee.

${QCM_DIFFICULTY_INSTRUCTIONS[difficulty]}

CONTRAINTES STRICTES :
1. Reponds UNIQUEMENT en JSON valide.
2. Genere EXACTEMENT 5 questions.
3. Chaque question a EXACTEMENT 4 options (options[0] a options[3]).
4. correct_index est l'index (0-3) de la bonne reponse.
5. explanation : explication courte et pedagogique de la bonne reponse (2-3 phrases max).
6. Les questions sont dans la langue de la fiche.

FORMAT JSON EXACT :
{
  "questions": [
    {
      "question": "La question posee a l'eleve ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Explication courte de pourquoi c'est la bonne reponse."
    }
  ]
}`
}

export function buildFlashcardPrompt(courseTitle: string, subject: string, content: string): string {
  return `MATIERE : ${subject}
TITRE DU COURS : ${courseTitle}

CONTENU DU COURS :
${content}`
}

export function buildQcmPrompt(flashcardTitle: string, summary: string, keyPoints: string[]): string {
  return `FICHE : ${flashcardTitle}

RESUME : ${summary}

POINTS CLES :
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Genere 5 questions QCM basees sur cette fiche.`
}

// Legacy exports pour la compatibilite
export const QCM_SYSTEM_PROMPT = getQcmSystemPrompt('easy')
    {
      "question": "La question posee a l'eleve ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Explication courte de pourquoi c'est la bonne reponse."
    }
  ]
}`
}

export function buildFlashcardPrompt(courseTitle: string, subject: string, content: string): string {
  return `MATIERE : ${subject}
TITRE DU COURS : ${courseTitle}

CONTENU DU COURS :
${content}`
}

export function buildQcmPrompt(flashcardTitle: string, summary: string, keyPoints: string[]): string {
  return `FICHE : ${flashcardTitle}

RESUME : ${summary}

POINTS CLES :
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Genere 5 questions QCM basees sur cette fiche.`
}

// Legacy exports pour la compatibilite
export const QCM_SYSTEM_PROMPT = getQcmSystemPrompt('easy')
