import { getQcmSystemPrompt, buildQcmPrompt, QCM_QUESTIONS_REQUESTED, QCM_QUESTIONS_PER_FLASHCARD, type QcmDifficulty } from '../../lib/ai/prompts'
import type { GeneratedQuestion } from '../../lib/ai/generate'
import type { Fiche } from './fixtures.mts'

type Parse = <T>(raw: string) => T | null

export type Variant = {
  name: string
  system: (d: QcmDifficulty) => string
  user: (fiches: Fiche[]) => string
  maxTokens: (n: number) => number
  /** null = parse KO */
  extract: (raw: string, fiches: Fiche[], parse: Parse) => GeneratedQuestion[] | null
}

function normalize(qs: any[]): GeneratedQuestion[] {
  return qs.map((q: any) => {
    const idxRaw = q.correct_index ?? q.correctIndex ?? q.correct ?? q.answer_index ?? 0
    const idx = typeof idxRaw === 'string' ? parseInt(idxRaw, 10) : Number(idxRaw)
    return {
      question: String(q.question || q.text || '').trim(),
      options: Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim())
        : Array.isArray(q.choices) ? q.choices.map((o: any) => String(o).trim()) : [],
      correct_index: Number.isFinite(idx) ? idx : -1,
      explanation: String(q.explanation || q.explication || q.reason || '').trim(),
    }
  })
}

// ===========================================================================
// A. `prod` - la production d'AVANT le 26/09, figee ici en litteral.
//
// Figee volontairement : c'est la ligne de base. Si elle importait
// getQcmSystemPrompt, elle suivrait les modifications du prompt et il n'y
// aurait plus rien a comparer.
//
// A noter : le prompt systeme annonce le format {"questions": [...]} tandis
// que le prompt utilisateur demande {"fiches": [{title, questions}]}. Cette
// contradiction est dans la ligne de base parce qu'elle etait en prod.
// ===========================================================================
const PROD_LENGTH_BALANCE_RULE = `- REGLE ANTI-BIAIS DE LONGUEUR (obligatoire) : la bonne reponse ne doit JAMAIS etre reconnaissable parce qu'elle est plus longue ou plus detaillee que les autres. Les 4 options doivent avoir une longueur comparable (ecart de 30% maximum en nombre de mots).
  Pour y arriver : ne raccourcis JAMAIS la bonne reponse. Choisis au hasard UNE des 3 mauvaises reponses et enrichis-la avec une justification plausible mais fausse, de meme longueur que la bonne reponse. Les 2 autres mauvaises reponses peuvent rester courtes.
  Varie la position (index) de la bonne reponse et celle du distracteur enrichi d'une question a l'autre.`

const PROD_DIFFICULTY: Record<QcmDifficulty, string> = {
  peaceful: `NIVEAU PAISIBLE (tres facile) :
- Questions ultra-directes sur les definitions et faits principaux du cours.
- Les mauvaises reponses sont clairement et evidemment differentes de la bonne.
- ZERO piege, ZERO nuance subtile, ZERO connaissance hors-cours.
- Formulations tres simples, une seule idee par question.
- L'eleve qui a lu la fiche une seule fois doit pouvoir repondre facilement.`,
  easy: `NIVEAU NORMAL :
- Questions directes sur les definitions et faits principaux du cours.
- Les mauvaises reponses sont plausibles mais clairement identifiables avec un peu de reflexion.
- Quelques pieges simples (formulations proches, inversions de details).
- Formulations claires, niveau college.
- Reste STRICTEMENT dans le perimetre de la fiche.
- L'eleve qui a bien lu sa fiche doit obtenir un bon score.
${PROD_LENGTH_BALANCE_RULE}`,
  medium: `NIVEAU HARDCORE :
- Questions de comprehension avancee : l'eleve doit avoir vraiment compris, pas juste memorise.
- Les mauvaises reponses sont tres plausibles et proches de la bonne reponse.
- Inclure des questions d'application, de comparaison, et quelques pieges subtils.
- Ajouter 1 ou 2 questions de culture generale directement liees au sujet de la fiche.
- Formulations qui demandent de reflechir et de croiser les informations.
- La difficulte doit venir de la subtilite sur le contenu REELLEMENT enseigne dans CETTE fiche.
${PROD_LENGTH_BALANCE_RULE}`,
}

const prod: Variant = {
  name: 'prod',
  system: (d) => `Tu es un assistant pedagogique qui cree des QCM pour des eleves de college et lycee.

${PROD_DIFFICULTY[d]}

CONTRAINTES STRICTES :
1. Reponds UNIQUEMENT en JSON valide.
2. Genere EXACTEMENT ${QCM_QUESTIONS_REQUESTED} questions par fiche.
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
}`,
  user: (fiches) => {
    const list = fiches.map((f, i) =>
      `--- Fiche ${i + 1}: ${f.title} ---\nResume: ${f.summary}\nPoints cles: ${f.key_points.join(', ')}`
    ).join('\n\n')
    return `Genere exactement ${QCM_QUESTIONS_REQUESTED} questions QCM pour CHACUNE des ${fiches.length} fiches suivantes.

${list}

Reponds avec un JSON structure ainsi :
{
  "fiches": [
    {
      "title": "titre exact de la fiche",
      "questions": [
        {
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "explanation": "..."
        }
      ]
    }
  ]
}`
  },
  maxTokens: (n) => Math.min(600 * n * QCM_QUESTIONS_REQUESTED + 300, 12000),
  extract: (raw, _f, parse) => {
    const p = parse<{ fiches: Array<{ title: string; questions: any[] }> }>(raw)
    if (!p?.fiches?.[0]?.questions) return null
    return normalize(p.fiches[0].questions)
  },
}

// ===========================================================================
// B. `shipped` - exactement ce que la production execute maintenant.
//
// Importe le vrai prompt : si lib/ai/prompts.ts change, ce benchmark mesure
// le changement. C'est le but.
// ===========================================================================
const shipped: Variant = {
  name: 'shipped',
  system: (d) => getQcmSystemPrompt(d, QCM_QUESTIONS_REQUESTED),
  user: (fiches) => buildQcmPrompt(fiches[0]),
  maxTokens: () => 3000,
  extract: (raw, _f, parse) => {
    const p = parse<{ questions: any[] }>(raw)
    if (!p?.questions || !Array.isArray(p.questions)) return null
    return normalize(p.questions)
  },
}

/** C. Comme `shipped` mais 5 questions demandees : mesure l'utilite du tampon. */
const shipped5: Variant = {
  ...shipped,
  name: 'shipped5',
  system: (d) => getQcmSystemPrompt(d, QCM_QUESTIONS_PER_FLASHCARD),
}

/** D. Comme `shipped` mais 7 demandees : tampon plus large, sortie plus longue. */
const shipped7: Variant = {
  ...shipped,
  name: 'shipped7',
  system: (d) => getQcmSystemPrompt(d, 7),
}

export const VARIANTS: Record<string, Variant> = { prod, shipped, shipped5, shipped7 }
