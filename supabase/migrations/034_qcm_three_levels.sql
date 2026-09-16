-- Migration 034 : passage de 4 a 3 niveaux de QCM
-- Le niveau 'hard' ("Teste tes parents") est supprime : il n'est plus propose
-- ni genere. Les tentatives historiques (qcm_attempts) ne stockent pas la
-- difficulte, l'historique et les stats des eleves restent donc intacts ;
-- seules les questions elles-memes sont retirees.

DELETE FROM public.qcm_questions WHERE difficulty = 'hard';

-- Le CHECK de la migration 014 est une contrainte anonyme : on retrouve son nom
-- dynamiquement avant de la remplacer.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT c.conname INTO cname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'qcm_questions'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%difficulty%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.qcm_questions DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.qcm_questions
  ADD CONSTRAINT qcm_questions_difficulty_check
  CHECK (difficulty IN ('peaceful','easy','medium'));
