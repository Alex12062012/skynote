-- Migration 035 : langue des fiches choisie a la creation du cours
-- Sert a la dictee (langue de reconnaissance) et a la lecture a voix haute
-- (choix de la voix). NULL = 'auto' (langue detectee par l'IA, non stockee).

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS content_lang text
    CHECK (content_lang IS NULL OR content_lang ~ '^[a-z]{2}$');
