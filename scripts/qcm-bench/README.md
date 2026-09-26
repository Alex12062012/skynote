# Benchmark de génération des QCM

Écrit le 2026-09-26 pour répondre à une question précise : **pourquoi des
niveaux de QCM restent-ils incomplets, et que faut-il changer pour que ça
n'arrive plus ?**

Les scripts appellent vraiment l'API Anthropic (clé lue dans `.env.local`) et
font passer les réponses par la **vraie validation de production**
(`validateGeneratedQuestions`), pour que « acceptable » veuille dire ici
exactement ce que ça veut dire en prod.

```bash
# Comparaison modèles × variantes de prompt
MODELS=claude-sonnet-5,claude-haiku-4-5-20251001 \
VARIANTS=prod,shipped REPS=2 CONCURRENCY=1 \
npx tsx scripts/qcm-bench/bench.mts

# Ce que la mesure implique pour un cours entier
npx tsx scripts/qcm-bench/converge.mts
```

| fichier | rôle |
|---|---|
| `fixtures.mts` | 4 fiches réelles (SVT, Histoire, Maths, Histoire-géo) |
| `variants.mts` | `prod` (figée, l'ancienne prod) et `shipped` (importe le vrai prompt) |
| `bench.mts` | un appel = une ligne : latence, tokens, `stop_reason`, parse, validation |
| `converge.mts` | bootstrap sur les résultats mesurés → probabilité qu'un **cours** soit complet |

`prod` est figée en littéral dans `variants.mts` **exprès** : si elle importait
`getQcmSystemPrompt`, elle suivrait les modifications du prompt et il n'y
aurait plus de ligne de base.

## Ce que la mesure a montré (2026-09-26)

### Les trois causes d'échec, dans l'ordre

1. **Troncature.** `max_tokens` valait `600 × fiches × questions + 300`, soit
   3 900 pour une fiche. Le niveau Hardcore le dépassait vraiment. Le code ne
   regardait jamais `stop_reason`, donc ça ressortait en « Parse failed » sans
   dire pourquoi. Visible dans les logs Vercel du 26/09 : JSON coupé en plein
   milieu d'une `explanation`.
2. **Biais de longueur.** La règle anti-biais demandait d'*enrichir* un
   distracteur avec une fausse justification. Ça allonge la sortie (donc la
   latence, donc la troncature) et le filtre rejetait quand même souvent 1 ou 2
   questions sur 6 → « 4/5 questions valides » → retry nécessaire.
3. **Deux formats JSON contradictoires dans le même appel.** Le prompt système
   annonçait `{"questions": [...]}`, le prompt utilisateur demandait
   `{"fiches": [{title, questions}]}`.

Et la conséquence commune : le retry était derrière une échéance fixe à 30 s.
Première passe lente → `retry saute (budget temps depasse)` → niveau partiel.

### Sweep modèles × variantes (192 appels, séquentiel)

| modèle / variante | n | p50 | p95 | tokens | parse | 5/5 valides | tronqué |
|---|---|---|---|---|---|---|---|
| sonnet-5 / `prod` | 24 | 9,9 s | **37,4 s** | 1588 | 96 % | 92 % | **8 %** |
| sonnet-5 / lean6 | 24 | 6,6 s | 13,3 s | 800 | 88 % | 83 % | 0 % |
| sonnet-5 / lean7 | 24 | 7,5 s | 21,4 s | 1050 | 100 % | 96 % | 0 % |
| haiku-4.5 / `prod` | 24 | 8,7 s | 15,7 s | 1193 | 100 % | 75 % | 0 % |
| haiku-4.5 / lean5 | 24 | 5,8 s | 9,3 s | 717 | 100 % | 75 % | 0 % |
| **haiku-4.5 / lean6** | 24 | **6,0 s** | **9,6 s** | **823** | **100 %** | **100 %** | **0 %** |
| haiku-4.5 / lean7 | 24 | 6,3 s | 12,7 s | 894 | 100 % | 100 % | 0 % |

Le p95 est le chiffre qui décide de tout : c'est lui qui dit si un retry rentre
encore dans les 60 s de la fonction Vercel. **37,4 s → 9,6 s.**

Sonnet perd des points en `parse` sur les prompts courts (il ajoute parfois du
texte autour du JSON) ; Haiku respecte le format demandé sans exception sur
l'ensemble des mesures.

### Pourquoi 6 questions demandées pour 5 gardées

Le tampon d'une question absorbe les rejets du filtre anti-biais. Sans lui
(`lean5` / `shipped5`), le taux de lots valides s'effondre — c'est la mesure,
pas une intuition.

## De « taux par appel » à « cours complet »

Un taux d'échec par appel ne dit rien à l'utilisateur. `converge.mts` fait le
pont : il rejoue la mécanique de `fillQcmLevel` (plusieurs tours tant que le
budget le permet, **accumulation** des questions valides entre les tours) en
tirant au sort dans les résultats réellement observés — donc la distribution
des « 4/5 », « 3/5 », « parse KO » est celle du vrai modèle.

C'est cette accumulation qui change tout : un appel qui échoue rend presque
toujours 4 bonnes questions sur 5. L'ancien code les jetait. Les garder veut
dire que le tour suivant n'a plus qu'une seule question à trouver.
