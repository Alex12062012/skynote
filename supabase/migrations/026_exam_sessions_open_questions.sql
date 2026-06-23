-- ─── Migration : questions ouvertes DNB ──────────────────────────────────────
-- Ajoute les colonnes manquantes pour le nouveau format (questions ouvertes)
-- answers devient des réponses texte, on stocke aussi le sujet de rédaction
-- et les corrections détaillées par question.

alter table public.exam_sessions
  add column if not exists redaction    jsonb,     -- sujet de rédaction tiré au sort
  add column if not exists corrections  jsonb;     -- [{questionId, matiere, points, feedback}]

-- Note : la colonne "answers" était jsonb (index entiers), elle reste jsonb
-- mais contiendra désormais des strings (texte libre). Pas de changement de type nécessaire.
