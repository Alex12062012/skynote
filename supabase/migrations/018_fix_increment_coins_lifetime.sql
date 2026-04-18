-- ============================================================
-- MIGRATION 018 — FIX INCREMENT_COINS & BACKFILL FROM TRANSACTIONS
--
-- Contexte
-- --------
-- Avant 016, le RPC `increment_coins(user_id, amount)` ne touchait
-- que `sky_coins`. Depuis 016, on a ajouté `total_coins_earned`,
-- `weekly_coins` et `monthly_coins` pour le leaderboard, mais seul
-- le nouveau RPC `award_coins` met ces compteurs à jour.
--
-- Problème : tout le code applicatif legacy utilise encore
-- `increment_coins` (fidélité, objectifs, parrainage, ajustements
-- admin, spend). Conséquence : les joueurs qui gagnent des coins
-- par ces canaux voient `sky_coins` monter mais PAS les compteurs
-- du classement ⇒ lifetime faux, leaderboard all_time faux.
--
-- Exemple : Alissa a `sky_coins = 1030` mais `total_coins_earned = 90`
-- car seuls ses QCM parfaits (via award_coins) ont été trackés.
--
-- Fix
-- ---
-- 1. On étend `increment_coins` pour qu'il mette à jour tous les
--    compteurs quand le montant est positif (gain), avec reset
--    hebdo/mensuel comme `award_coins`. Pour un montant négatif
--    (dépense), on ne touche que `sky_coins`.
-- 2. On backfill `total_coins_earned` / `weekly_coins` /
--    `monthly_coins` depuis `coin_transactions` qui contient
--    l'historique complet de TOUS les gains (QCM, fidélité,
--    objectifs, parrainage, admin...).
-- ============================================================

-- ------------------------------------------------------------
-- 1. PATCH increment_coins : track lifetime + weekly + monthly
-- ------------------------------------------------------------
create or replace function public.increment_coins(
  p_user_id uuid,
  p_amount  integer
) returns void
language plpgsql security definer as $$
begin
  if p_amount > 0 then
    -- reset hebdo/mensuel si besoin (même logique qu'award_coins)
    update public.profiles
       set weekly_coins  = case when week_start  < date_trunc('week',  now()) then 0 else weekly_coins  end,
           week_start    = case when week_start  < date_trunc('week',  now()) then date_trunc('week',  now()) else week_start  end,
           monthly_coins = case when month_start < date_trunc('month', now()) then 0 else monthly_coins end,
           month_start   = case when month_start < date_trunc('month', now()) then date_trunc('month', now()) else month_start end
     where id = p_user_id;

    -- crédite tous les compteurs
    update public.profiles
       set sky_coins          = sky_coins + p_amount,
           total_coins_earned = total_coins_earned + p_amount,
           weekly_coins       = weekly_coins + p_amount,
           monthly_coins      = monthly_coins + p_amount
     where id = p_user_id;
  else
    -- Dépense (ou ajustement négatif) : on ne touche QUE sky_coins,
    -- jamais total_coins_earned (qui reste l'historique des gains).
    update public.profiles
       set sky_coins = greatest(0, sky_coins + p_amount)
     where id = p_user_id;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 2. BACKFILL depuis coin_transactions (source de vérité)
--
-- On calcule la somme des amounts POSITIFS (gains uniquement) :
--   - total lifetime = sum(amount > 0)
--   - weekly         = sum(amount > 0 since lundi minuit)
--   - monthly        = sum(amount > 0 since 1er du mois)
--
-- On prend GREATEST(actuel, historique) pour ne JAMAIS baisser
-- un compteur (idempotent + safe si la migration 017 ou
-- award_coins ont déjà mis des valeurs correctes).
-- ------------------------------------------------------------
with agg as (
  select
    user_id,
    coalesce(sum(amount) filter (where amount > 0), 0)::int                                                            as lifetime_coins,
    coalesce(sum(amount) filter (where amount > 0 and created_at >= date_trunc('week',  now())), 0)::int               as week_coins,
    coalesce(sum(amount) filter (where amount > 0 and created_at >= date_trunc('month', now())), 0)::int               as month_coins
  from public.coin_transactions
  group by user_id
)
update public.profiles p
set
  total_coins_earned = greatest(p.total_coins_earned, agg.lifetime_coins),
  weekly_coins       = greatest(p.weekly_coins,       agg.week_coins),
  monthly_coins      = greatest(p.monthly_coins,      agg.month_coins)
from agg
where agg.user_id = p.id;

-- ------------------------------------------------------------
-- 3. REMISE À JOUR des week_start / month_start
-- (si on a injecté du weekly/monthly backfillé, il faut aligner
--  les bornes sinon le prochain award_coins les reset à 0)
-- ------------------------------------------------------------
update public.profiles
set week_start = date_trunc('week', now())
where week_start < date_trunc('week', now());

update public.profiles
set month_start = date_trunc('month', now())
where month_start < date_trunc('month', now());
