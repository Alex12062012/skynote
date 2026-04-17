-- ============================================================
-- MIGRATION 017 — BACKFILL LEADERBOARD
-- Recalcule weekly_coins / monthly_coins / total_coins_earned
-- et total_qcm_perfect / total_qcm_attempted pour les utilisateurs
-- existants à partir de la table qcm_attempts.
--
-- 016 a ajouté les colonnes avec `default 0` ⇒ pour tous les
-- joueurs déjà présents avant 016, le classement paraissait vide.
-- Cette migration corrige le tir en remplissant les compteurs à
-- partir de l'historique réel.
-- ============================================================

-- ------------------------------------------------------------
-- BACKFILL DES COMPTEURS
-- ------------------------------------------------------------
with agg as (
  select
    user_id,
    coalesce(sum(coins_earned), 0)::int                                                    as lifetime_coins,
    coalesce(sum(coins_earned) filter (where created_at >= date_trunc('week',  now())), 0)::int as week_coins,
    coalesce(sum(coins_earned) filter (where created_at >= date_trunc('month', now())), 0)::int as month_coins,
    count(*) filter (where perfect)::int  as perfect_count,
    count(*)::int                          as attempt_count
  from public.qcm_attempts
  group by user_id
)
update public.profiles p
set
  -- on NE dépasse jamais ce qui est déjà là (idempotent + évite d'écraser
  -- les gains faits via saveQcmAttemptV2 depuis l'application de 016)
  total_coins_earned  = greatest(p.total_coins_earned,  agg.lifetime_coins),
  weekly_coins        = greatest(p.weekly_coins,        agg.week_coins),
  monthly_coins       = greatest(p.monthly_coins,       agg.month_coins),
  total_qcm_perfect   = greatest(p.total_qcm_perfect,   agg.perfect_count),
  total_qcm_attempted = greatest(p.total_qcm_attempted, agg.attempt_count)
from agg
where agg.user_id = p.id;

-- ------------------------------------------------------------
-- REMISE À ZÉRO des week_start / month_start si dans le passé
-- (pour que le prochain award_coins déclenche correctement les
--  resets hebdo / mensuel sans effacer le backfill ci-dessus)
-- ------------------------------------------------------------
update public.profiles
set week_start = date_trunc('week', now())
where week_start < date_trunc('week', now());

update public.profiles
set month_start = date_trunc('month', now())
where month_start < date_trunc('month', now());
