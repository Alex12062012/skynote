-- Colonnes SM-2 sur flashcards
alter table public.flashcards
  add column if not exists mastery_level   smallint    not null default 0,
  add column if not exists ease_factor     float       not null default 2.5,
  add column if not exists interval_days  integer     not null default 0,
  add column if not exists repetitions    integer     not null default 0,
  add column if not exists next_review_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

-- Historique des révisions
create table if not exists public.flashcard_reviews (
  id            uuid        primary key default uuid_generate_v4(),
  flashcard_id  uuid        not null references public.flashcards(id) on delete cascade,
  user_id       uuid        not null references public.profiles(id)   on delete cascade,
  grade         smallint    not null,
  interval_before integer   not null default 0,
  interval_after  integer   not null default 0,
  ease_before   float       not null default 2.5,
  ease_after    float       not null default 2.5,
  reviewed_at   timestamptz not null default now()
);

alter table public.flashcard_reviews enable row level security;

create policy "Users own reviews"
  on public.flashcard_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_flashcards_review
  on public.flashcards (user_id, next_review_at)
  where next_review_at is not null;
