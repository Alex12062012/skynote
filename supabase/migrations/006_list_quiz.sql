-- Table pour les quiz en mode liste (Q/R sans IA)
create table if not exists list_quizzes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  pairs       jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- Table pour les sessions de quiz (historique + coins)
create table if not exists list_quiz_sessions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references list_quizzes(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  score         int not null,
  total         int not null,
  coins_earned  int not null default 0,
  completed_at  timestamptz not null default now()
);

alter table list_quizzes  enable row level security;
alter table list_quiz_sessions enable row level security;

create policy "owner_quizzes"  on list_quizzes         for all using (auth.uid() = user_id);
create policy "owner_sessions" on list_quiz_sessions    for all using (auth.uid() = user_id);
