-- ============================================================
-- MIGRATION 019 — HEBDO/MENSUEL = SOLDE NET DE LA PÉRIODE
--
-- Contexte
-- --------
-- Jusqu'ici `weekly_coins` / `monthly_coins` comptaient uniquement
-- les GAINS bruts de la période. Problème : si tu gagnes 1000 lundi
-- et dépenses 1000 mardi, tu as `sky_coins = 0` mais tu apparais en
-- tête du classement hebdo avec "1000 cette semaine". Incohérent.
--
-- Décision produit
-- ----------------
-- Hebdo/mensuel doivent fonctionner comme `all_time` (solde actuel),
-- mais bornés à la période :
--   hebdo_displayed   = max(0, gains_semaine - dépenses_semaine)
--   mensuel_displayed = max(0, gains_mois     - dépenses_mois)
--
-- Reset :
--   - hebdo  → chaque lundi 00h  (date_trunc('week',  now()))
--   - mensuel → chaque 1er 00h   (date_trunc('month', now()))
--
-- Implémentation
-- --------------
-- 1. `spend_coins` décrémente aussi weekly/monthly (avec reset
--    check et floor à 0).
-- 2. `increment_coins` (cas négatif) fait pareil.
-- 3. Backfill : on recalcule weekly_coins/monthly_coins depuis
--    coin_transactions en prenant la somme NETTE (amount peut être
--    négatif), floorée à 0.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PATCH spend_coins : décrémenter weekly + monthly
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

  -- reset hebdo/mensuel si on vient de passer un lundi / 1er du mois
  update public.profiles
     set weekly_coins  = case when week_start  < date_trunc('week',  now()) then 0 else weekly_coins  end,
         week_start    = case when week_start  < date_trunc('week',  now()) then date_trunc('week',  now()) else week_start  end,
         monthly_coins = case when month_start < date_trunc('month', now()) then 0 else monthly_coins end,
         month_start   = case when month_start < date_trunc('month', now()) then date_trunc('month', now()) else month_start end
   where id = p_user_id;

  -- débite sky_coins + weekly/monthly (floor à 0 pour weekly/monthly)
  update public.profiles
     set sky_coins     = sky_coins - p_amount,
         weekly_coins  = greatest(0, weekly_coins  - p_amount),
         monthly_coins = greatest(0, monthly_coins - p_amount)
   where id = p_user_id;

  insert into public.coin_transactions (user_id, amount, reason)
  values (p_user_id, -p_amount, p_reason);

  return v_balance - p_amount;
end;
$$;

-- ------------------------------------------------------------
-- 2. PATCH increment_coins : cas négatif décrémente weekly + monthly
-- ------------------------------------------------------------
create or replace function public.increment_coins(
  p_user_id uuid,
  p_amount  integer
) returns void
language plpgsql security definer as $$
begin
  -- reset hebdo/mensuel si besoin (peu importe le signe)
  update public.profiles
     set weekly_coins  = case when week_start  < date_trunc('week',  now()) then 0 else weekly_coins  end,
         week_start    = case when week_start  < date_trunc('week',  now()) then date_trunc('week',  now()) else week_start  end,
         monthly_coins = case when month_start < date_trunc('month', now()) then 0 else monthly_coins end,
         month_start   = case when month_start < date_trunc('month', now()) then date_trunc('month', now()) else month_start end
   where id = p_user_id;

  if p_amount > 0 then
    -- Gain : incrémente tout (sky + lifetime + weekly + monthly)
    update public.profiles
       set sky_coins          = sky_coins + p_amount,
           total_coins_earned = total_coins_earned + p_amount,
           weekly_coins       = weekly_coins  + p_amount,
           monthly_coins      = monthly_coins + p_amount
     where id = p_user_id;
  else
    -- Dépense / ajustement négatif : décrémente sky + weekly + monthly,
    -- jamais total_coins_earned (qui reste l'historique des gains).
    -- Floor à 0 pour weekly/monthly.
    update public.profiles
       set sky_coins     = greatest(0, sky_coins     + p_amount),
           weekly_coins  = greatest(0, weekly_coins  + p_amount),
           monthly_coins = greatest(0, monthly_coins + p_amount)
     where id = p_user_id;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 3. BACKFILL weekly/monthly avec la somme NETTE depuis coin_transactions
--    (inclut donc gains ET dépenses de la période courante)
-- ------------------------------------------------------------
with agg as (
  select
    user_id,
    coalesce(sum(amount) filter (where created_at >= date_trunc('week',  now())), 0)::int as week_net,
    coalesce(sum(amount) filter (where created_at >= date_trunc('month', now())), 0)::int as month_net
  from public.coin_transactions
  group by user_id
)
update public.profiles p
set
  weekly_coins  = greatest(0, agg.week_net),
  monthly_coins = greatest(0, agg.month_net)
from agg
where agg.user_id = p.id;
