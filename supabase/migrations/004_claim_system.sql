-- Système de réclamation des récompenses
alter table public.user_objectives
  add column if not exists claimed boolean not null default false,
  add column if not exists claimed_at timestamptz;

-- Mettre les objectifs déjà complétés comme "réclamés" pour ne pas casser l'existant
update public.user_objectives set claimed = true where completed = true;
