-- Partage de cours : tracer la provenance d'un cours cloné via un lien de partage
-- Permet de rendre le "claim" idempotent (un utilisateur ne récupère le cours
-- qu'une seule fois, même s'il revisite le lien plusieurs fois).

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS origin_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS courses_origin_course_id_idx
  ON public.courses (user_id, origin_course_id);
