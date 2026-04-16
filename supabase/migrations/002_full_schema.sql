-- ============================================================
-- COURSES
-- ============================================================
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text not null,
  color text not null default '#2563EB',
  source_type text not null check (source_type in ('text','pdf','photo','vocal')),
  source_content text,
  file_url text,
  status text not null default 'processing' check (status in ('processing','ready','error')),
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses enable row level security;
create policy "Users own courses" on public.courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger set_courses_updated_at before update on public.courses for each row execute function handle_updated_at();

-- ============================================================
-- FLASHCARDS
-- ============================================================
create table if not exists public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  summary text not null,
  key_points jsonb not null default '[]',
  is_mastered boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.flashcards enable row level security;
create policy "Users own flashcards" on public.flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- QCM QUESTIONS
-- ============================================================
create table if not exists public.qcm_questions (
  id uuid primary key default uuid_generate_v4(),
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]',
  correct_index integer not null,
  explanation text not null,
  created_at timestamptz not null default now()
);
alter table public.qcm_questions enable row level security;
create policy "Users own qcm_questions" on public.qcm_questions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- QCM ATTEMPTS
-- ============================================================
create table if not exists public.qcm_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  score integer not null,
  total integer not null,
  perfect boolean not null default false,
  coins_earned integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.qcm_attempts enable row level security;
create policy "Users own qcm_attempts" on public.qcm_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- OBJECTIVES
-- ============================================================
create table if not exists public.objectives (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  title text not null,
  description text not null,
  icon text not null default '🏆',
  reward_coins integer not null default 10,
  target_value integer not null default 1
);
alter table public.objectives enable row level security;
create policy "Objectives are public" on public.objectives for select using (true);

-- Seed objectifs
insert into public.objectives (key, title, description, icon, reward_coins, target_value) values
  ('first_course',   'Premier cours',          'Crée ton premier cours',              '🚀', 5,  1),
  ('perfect_qcm_10', 'Maître du QCM',          'Obtiens 10 scores parfaits au QCM',   '⚡', 10, 10),
  ('streak_7',       'Régularité',             'Connecte-toi 7 jours de suite',       '🔥', 20, 7),
  ('mastery_all',    'Maîtrise totale',         'Maîtrise toutes les fiches d''un cours','🎓', 15, 1),
  ('five_courses',   'Cinq cours',              'Crée 5 cours',                        '📚', 25, 5),
  ('qcm_50',         'QCM aficionado',          'Réponds à 50 questions QCM',          '🧠', 30, 50),
  ('share_friend',   'Parraine un ami',         'Invite un ami à rejoindre Skynote',   '🤝', 15, 1)
on conflict (key) do nothing;

-- ============================================================
-- USER_OBJECTIVES
-- ============================================================
create table if not exists public.user_objectives (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  objective_id uuid not null references public.objectives(id) on delete cascade,
  current_value integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, objective_id)
);
alter table public.user_objectives enable row level security;
create policy "Users own user_objectives" on public.user_objectives for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- COIN_TRANSACTIONS
-- ============================================================
create table if not exists public.coin_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.coin_transactions enable row level security;
create policy "Users own transactions" on public.coin_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-files', 'course-files', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "Users upload own files" on storage.objects for insert
  with check (bucket_id = 'course-files' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users read own files" on storage.objects for select
  using (bucket_id = 'course-files' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own files" on storage.objects for delete
  using (bucket_id = 'course-files' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- REALTIME — activer pour ProcessingLoader
-- ============================================================
alter publication supabase_realtime add table public.courses;
