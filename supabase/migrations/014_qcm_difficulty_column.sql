-- Migration 014 : ajout de la colonne difficulty sur qcm_questions
-- et support du niveau 'peaceful'

ALTER TABLE public.qcm_questions
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('peaceful','easy','medium','hard'));

-- Les questions existantes sans difficulty sont considerees 'medium'
-- (comportement retrocompatible)

-- Index pour accelerer les requetes par flashcard + difficulty
CREATE INDEX IF NOT EXISTS qcm_questions_flashcard_difficulty_idx
  ON public.qcm_questions (flashcard_id, difficulty);
