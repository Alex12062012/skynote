-- Colonnes sur flashcards
alter table public.flashcards
  add column if not exists consecutive_errors  smallint    not null default 0,
  add column if not exists last_error_at       timestamptz,
  add column if not exists last_ai_analysis_at timestamptz,
  add column if not exists source_type         text        not null default 'user'
    check (source_type in ('user', 'ai_generated'));

-- Quota d'usage IA par jour
create table if not exists public.ai_usage (
  id          uuid    primary key default uuid_generate_v4(),
  user_id     uuid    not null references public.profiles(id) on delete cascade,
  usage_date  date    not null,
  count       integer not null default 0,
  unique (user_id, usage_date)
);

alter table public.ai_usage enable row level security;
create policy "Users own ai_usage"
  on public.ai_usage for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Analyses d'erreurs
create table if not exists public.error_analyses (
  id                     uuid        primary key default uuid_generate_v4(),
  user_id                uuid        not null references public.profiles(id) on delete cascade,
  flashcard_id           uuid        not null references public.flashcards(id) on delete cascade,
  error_count            integer     not null,
  ai_explanation         text        not null,
  generated_flashcard_id uuid        references public.flashcards(id) on delete set null,
  created_at             timestamptz not null default now()
);

alter table public.error_analyses enable row level security;
create policy "Users own error_analyses"
  on public.error_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_error_analyses_flashcard
  on public.error_analyses (flashcard_id, created_at desc);
