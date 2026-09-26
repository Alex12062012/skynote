# Tests de concurrence — génération de fiches et de QCM

Harnais écrit le 2026-09-26 pour le bug « 8 fiches au lieu de 4 / 10 questions
au lieu de 5 ». La cause n'était pas la qualité des réponses de Claude mais un
read-then-write : deux requêtes concurrentes passaient la même garde
« est-ce que ça existe déjà ? » et inséraient toutes les deux. Voir la
migration `042_generation_locks.sql`.

Ces scripts écrivent en base (utilisateur et cours jetables, supprimés à la
fin) et lisent `.env.local`. Lancer depuis la racine du dépôt.

| script | ce qu'il prouve | dépend de Claude |
|---|---|---|
| `race-repro.mjs <legacy\|claim> <latenceIA_ms> <ecart_ms> <requetes>` | la garde `count > 0` ne tient pas ; le bail, oui | non |
| `lock-semantics.mjs` | prise / refus / release / expiration du bail, clés indépendantes | non |
| `e2e-race.mjs <ecart_ms>` | `POST /api/generate` concurrents : un seul 202, un seul débit de 118✦ | oui (insertion) |
| `e2e-qcm-race.mjs <vagues>` | `POST /api/generate-qcm/level` concurrents : une seule vague passe par niveau | oui (insertion) |

Les deux derniers visent `http://localhost:3000` par défaut (`BASE`) et ont
besoin d'un `ANTHROPIC_API_KEY` valide pour aller jusqu'à l'insertion ; sans
clé valide ils vérifient quand même le verrou (le gagnant échoue en 500 au
lieu d'insérer).

Le mode `claim` reproduit l'ordre du code corrigé : **prendre le bail, PUIS
lire**. C'est l'ordre qui compte — une lecture faite avant la prise du bail est
déjà périmée au moment d'écrire, et la requête qui obtient le bail en second
régénère ce que la première vient d'écrire. Le scénario B ci-dessous est
exactement ce cas.

## Résultats de référence (2026-09-26)

Mesurés dans l'ordre, avant / après `042` et `043` :

```
AVANT tout correctif (garde `count > 0` seule, pas d'index unique)
  race-repro legacy  2 requêtes simultanées  -> 8 fiches / 2 INSERT   BUG
  race-repro legacy  8 requêtes simultanées  -> 32 fiches / 8 INSERT  BUG
  e2e-race                                   -> 2× 202, solde 1000->882->764
                                                (236✦ débités, 2 pipelines)   BUG

APRÈS 042 (bail) + 043 (index unique)
  A. race-repro claim  3 requêtes simultanées -> 4 fiches / 1 INSERT           OK
  B. race-repro claim  2 requêtes sérialisées -> w2 lit 4 sous le bail
     (écart 2500 ms > latence 1500 ms)           et s'arrête sans générer      OK
  e2e-race                                   -> 1× 202 + 1× « Generation deja
                                                en cours », un seul débit      OK
  e2e-qcm                                    -> par niveau : 1 vague passe,
                                                les autres refusées            OK
  race-repro legacy (bail contourné)         -> l'index unique refuse le 2e
                                                INSERT                         OK
```

Ce dernier point est le filet structurel : même en rejouant l'ancien chemin
sans bail, la base refuse désormais le second lot. `legacy` ne peut donc plus
reproduire le bug — c'est voulu.
