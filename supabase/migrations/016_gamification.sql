-- ============================================================
-- MIGRATION 016 — GAMIFICATION COMPLÈTE
-- Prestige · Titres · Badges · Likes · Leaderboard saisonnier
-- Boosts consommables · Stats joueur
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES : colonnes gamification
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists prestige_level        integer     not null default 0,
  add column if not exists active_title_id       text,
  add column if not exists active_badge_id       text        not null default 'letter',
  add column if not exists total_coins_earned    integer     not null default 0,
  add column if not exists total_qcm_perfect     integer     not null default 0,
  add column if not exists total_qcm_attempted   integer     not null default 0,
  add column if not exists perfect_streak        integer     not null default 0,
  add column if not exists best_perfect_streak   integer     not null default 0,
  add column if not exists weekly_coins          integer     not null default 0,
  add column if not exists monthly_coins         integer     not null default 0,
  add column if not exists week_start            timestamptz not null default date_trunc('week', now()),
  add column if not exists month_start           timestamptz not null default date_trunc('month', now()),
  add column if not exists likes_received        integer     not null default 0,
  add column if not exists bio                   text;

-- Index pour le leaderboard saisonnier
create index if not exists profiles_weekly_coins_idx  on public.profiles (weekly_coins desc)  where role is distinct from 'teacher';
create index if not exists profiles_monthly_coins_idx on public.profiles (monthly_coins desc) where role is distinct from 'teacher';
create index if not exists profiles_pseudo_idx        on public.profiles (lower(pseudo));

-- ------------------------------------------------------------
-- USER_TITLES : titres débloqués par joueur
-- ------------------------------------------------------------
create table if not exists public.user_titles (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  title_id    text        not null,          -- ex: 'machine_5_5', 'renaissance_1'
  source      text        not null default 'unlock' check (source in ('unlock','purchase','prestige','wheel','event')),
  unlocked_at timestamptz not null default now(),
  unique (user_id, title_id)
);
alter table public.user_titles enable row level security;
create policy "Users see own titles"       on public.user_titles for select using (auth.uid() = user_id);
create policy "Users insert own titles"    on public.user_titles for insert with check (auth.uid() = user_id);
-- Lecture publique des titres d'autrui via service_role (via server actions)

-- ------------------------------------------------------------
-- USER_BADGES : badges cosmétiques débloqués
-- ------------------------------------------------------------
create table if not exists public.user_badges (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  badge_id    text        not null,          -- ex: 'brain', 'rocket', 'star'
  source      text        not null default 'purchase' check (source in ('purchase','unlock','wheel','event')),
  unlocked_at timestamptz not null default now(),
  unique (user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "Users see own badges"    on public.user_badges for select using (auth.uid() = user_id);
create policy "Users insert own badges" on public.user_badges for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- USER_BOOSTS : boosts temporaires (×2 coins, retry QCM, skip question)
-- ------------------------------------------------------------
create table if not exists public.user_boosts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  boost_type text        not null check (boost_type in ('x2_coins','retry_qcm','skip_question')),
  expires_at timestamptz,                     -- null = charge unitaire (retry/skip)
  charges    integer     not null default 1,  -- 1 pour consommable, ignoré pour timer
  created_at timestamptz not null default now()
);
alter table public.user_boosts enable row level security;
create policy "Users manage own boosts" on public.user_boosts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists user_boosts_active_idx on public.user_boosts (user_id, boost_type, expires_at);

-- ------------------------------------------------------------
-- PROFILE_LIKES : 1 like par utilisateur vers un autre
-- ------------------------------------------------------------
create table if not exists public.profile_likes (
  id         uuid        primary key default gen_random_uuid(),
  liker_id   uuid        not null references public.profiles(id) on delete cascade,
  liked_id   uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (liker_id, liked_id),
  check (liker_id <> liked_id)
);
alter table public.profile_likes enable row level security;
create policy "Users manage own likes"  on public.profile_likes for all
  using (auth.uid() = liker_id) with check (auth.uid() = liker_id);
create policy "Anyone reads likes"      on public.profile_likes for select using (true);
create index if not exists profile_likes_liked_idx on public.profile_likes (liked_id);

-- Trigger pour maintenir profiles.likes_received à jour
create or replace function sync_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set likes_received = likes_received + 1 where id = new.liked_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set likes_received = greatest(likes_received - 1, 0) where id = old.liked_id;
  end if;
  return null;
end; $$;
drop trigger if exists trg_profile_likes_sync on public.profile_likes;
create trigger trg_profile_likes_sync
  after insert or delete on public.profile_likes
  for each row execute function sync_likes_count();

-- ------------------------------------------------------------
-- RPC : increment_coins étendu (prend en compte total & weekly)
-- ------------------------------------------------------------
create or replace function public.award_coins(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text
) returns integer
language plpgsql security definer as $$
declare
  v_final_balance integer;
begin
  if p_amount < 0 then
    raise exception 'award_coins: amount must be >= 0';
  end if;

  -- reset hebdo/mensuel si besoin
  update public.profiles
     set weekly_coins  = case when week_start  < date_trunc('week',  now()) then 0 else weekly_coins  end,
         week_start    = case when week_start  < date_trunc('week',  now()) then date_trunc('week',  now()) else week_start  end,
         monthly_coins = case when month_start < date_trunc('month', now()) then 0 else monthly_coins end,
         month_start   = case when month_start < date_trunc('month', now()) then date_trunc('month', now()) else month_start end
   where id = p_user_id;

  -- crédite
  update public.profiles
     set sky_coins          = sky_coins + p_amount,
         total_coins_earned = total_coins_earned + p_amount,
         weekly_coins       = weekly_coins + p_amount,
         monthly_coins      = monthly_coins + p_amount
   where id = p_user_id
   returning sky_coins into v_final_balance;

  if p_amount > 0 then
    insert into public.coin_transactions (user_id, amount, reason)
    values (p_user_id, p_amount, p_reason);
  end if;

  return v_final_balance;
end;
$$;

-- ------------------------------------------------------------
-- RPC : spend_coins (atomique, refuse si solde insuffisant)
-- ------------------------------------------------------------
create or replace function public.spend_coins(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text
) returns integer
language plpgsql security definer as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'spend_coins: amount must be > 0';
  end if;

  select sky_coins into v_balance
    from public.profiles
   where id = p_user_id
   for update;

  if v_balance is null then
    raise exception 'spend_coins: user not found';
  end if;
  if v_balance < p_amount then
    raise exception 'insufficient_coins';
  end if;

  update public.profiles
     set sky_coins = sky_coins - p_amount
   where id = p_user_id;

  insert into public.coin_transactions (user_id, amount, reason)
  values (p_user_id, -p_amount, p_reason);

  return v_balance - p_amount;
end;
$$;

-- ------------------------------------------------------------
-- RPC : perform_prestige (reset coins, +1 prestige)
-- ------------------------------------------------------------
create or replace function public.perform_prestige(p_user_id uuid)
returns table (new_prestige integer, cost integer)
language plpgsql security definer as $$
declare
  v_current integer;
  v_cost    integer;
  v_balance integer;
begin
  select prestige_level, sky_coins
    into v_current, v_balance
    from public.profiles
   where id = p_user_id
   for update;

  if v_current is null then
    raise exception 'user_not_found';
  end if;

  v_cost := 500 + v_current * 500;  -- P1=500, P2=1000, P3=1500...

  if v_balance < v_cost then
    raise exception 'insufficient_coins_for_prestige';
  end if;

  update public.profiles
     set sky_coins      = 0,              -- reset coins
         prestige_level = v_current + 1
   where id = p_user_id;

  -- Titre Renaissance I/II/III/...
  insert into public.user_titles (user_id, title_id, source)
  values (p_user_id, 'renaissance_' || (v_current + 1), 'prestige')
  on conflict (user_id, title_id) do nothing;

  insert into public.coin_transactions (user_id, amount, reason)
  values (p_user_id, -v_cost, 'Prestige ' || (v_current + 1));

  return query select (v_current + 1), v_cost;
end;
$$;

-- ------------------------------------------------------------
-- RPC : toggle_like
-- ------------------------------------------------------------
create or replace function public.toggle_like(p_liked_id uuid)
returns boolean
language plpgsql security definer as $$
declare
  v_uid     uuid;
  v_exists  boolean;
begin
  v_uid := auth.uid();
  if v_uid is null or v_uid = p_liked_id then
    raise exception 'invalid_like';
  end if;

  select exists(select 1 from public.profile_likes
                 where liker_id = v_uid and liked_id = p_liked_id)
    into v_exists;

  if v_exists then
    delete from public.profile_likes
     where liker_id = v_uid and liked_id = p_liked_id;
    return false;
  else
    insert into public.profile_likes (liker_id, liked_id) values (v_uid, p_liked_id);
    return true;
  end if;
end;
$$;
