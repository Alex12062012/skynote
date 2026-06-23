-- ─── Mini-épreuve brevet/bac ─────────────────────────────────────────────────
-- Une session = un examen complet multi-matières généré à partir des cours
-- de l'utilisateur. Les questions et réponses sont stockées en JSONB pour
-- éviter une table séparée (volume faible, pas de requêtes analytiques dessus).

create table if not exists public.exam_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- Questions générées par Claude : [{matiere, question, options: [a,b,c,d], correct: 0-3}]
  questions     jsonb not null default '[]'::jsonb,

  -- Réponses de l'utilisateur : index de l'option choisie par question (null si non répondu)
  answers       jsonb not null default '[]'::jsonb,

  -- Résultats (null jusqu'à la soumission)
  score         float,           -- pourcentage 0-100
  mention       text,            -- 'tres_bien' | 'bien' | 'assez_bien' | 'passable' | 'insuffisant'

  -- Statut de la session
  status        text not null default 'pending'
                check (status in ('pending', 'completed')),

  -- Plan de l'utilisateur au moment de la création (pour l'affichage des résultats)
  plan_snapshot text not null default 'free',

  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- Accès uniquement à ses propres sessions
alter table public.exam_sessions enable row level security;

create policy "Users see own exam sessions"
  on public.exam_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own exam sessions"
  on public.exam_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own exam sessions"
  on public.exam_sessions for update
  using (auth.uid() = user_id);

-- Index pour les requêtes fréquentes (lister ses sessions, vérifier le quota mensuel)
create index exam_sessions_user_id_idx on public.exam_sessions(user_id, created_at desc);
