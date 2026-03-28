-- Migration 006 — Pseudo leaderboard + user_number
alter table public.profiles
  add column if not exists pseudo text,
  add column if not exists user_number serial;

-- Remplir user_number pour les profils existants (par ordre de creation)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.profiles
  WHERE user_number IS NULL OR user_number = 0
)
UPDATE public.profiles p SET user_number = n.rn FROM numbered n WHERE p.id = n.id;
