-- ═══════════════════════════════════════════════════════════════════════════
-- Nettoyage des fiches en double + filet structurel
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Suite de 042. Le verrou empêche de NOUVEAUX doublons ; il reste ceux déjà
-- écrits en base avant le 2026-09-26 : 4 cours, 19 fiches en trop (et leurs
-- questions QCM, supprimées en cascade par qcm_questions_flashcard_id_fkey).
-- On garde le premier lot inséré (created_at le plus ancien) et on jette les
-- suivants — les lots sont identiques au mot près, c'est le même cours généré
-- deux fois.
--
DELETE FROM flashcards
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (PARTITION BY course_id, order_index
                              ORDER BY created_at, id) AS rn
    FROM flashcards
  ) ranked
  WHERE rn > 1
);

-- ───────────────────────────────────────────────────────────────────────────
-- Filet structurel : même si un bail était contourné un jour, la base
-- refuserait le second lot de fiches. L'unicité de order_index par cours est
-- déjà supposée par le code — claim-actions.ts remappe les QCM d'un cours
-- copié via une Map order_index → nouvel id, ce qui n'est correct que si
-- order_index est unique.
-- ───────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS flashcards_course_order_unique
  ON flashcards (course_id, order_index);

NOTIFY pgrst, 'reload schema';
