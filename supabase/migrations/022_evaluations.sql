create table if not exists public.evaluations (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  name        text        not null,
  exam_date   date        not null,
  course_ids  uuid[]      not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.evaluations enable row level security;

create policy "Users own evaluations"
  on public.evaluations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_evaluations_user
  on public.evaluations (user_id, exam_date);
