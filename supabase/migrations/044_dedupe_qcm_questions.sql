-- ═══════════════════════════════════════════════════════════════════════════
-- Nettoyage des questions QCM en double
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Pendant de 043, côté QCM. Relevé le 2026-09-26 : 22 couples
-- (fiche, niveau) portent DEUX lots de questions au lieu d'un — signature
-- 5+5, 4+5 ou 3+3, chaque lot inséré par une instruction INSERT distincte à
-- quelques secondes d'écart. Même cause que les fiches en double : deux
-- requêtes concurrentes ont passé la garde `alreadyDone` (voir 042).
--
-- On garde le lot le PLUS COMPLET (5 questions plutôt que 4), en départageant
-- par le plus ancien. Un lot = une instruction INSERT, donc un created_at
-- commun à toutes ses lignes.
--
-- Pas d'index unique ici : deux générations produisent des libellés
-- différents, aucune clé naturelle ne les distinguerait. C'est le bail de 042
-- qui garantit qu'un seul lot est écrit.
-- ═══════════════════════════════════════════════════════════════════════════

WITH batches AS (
  SELECT flashcard_id,
         difficulty,
         created_at,
         count(*) AS batch_size,
         row_number() OVER (
           PARTITION BY flashcard_id, difficulty
           ORDER BY count(*) DESC, created_at ASC
         ) AS rn
  FROM qcm_questions
  GROUP BY flashcard_id, difficulty, created_at
)
DELETE FROM qcm_questions q
USING batches b
WHERE q.flashcard_id = b.flashcard_id
  AND q.difficulty   = b.difficulty
  AND q.created_at   = b.created_at
  AND b.rn > 1;
