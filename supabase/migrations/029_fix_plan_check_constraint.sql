-- ============================================================
-- 029_fix_plan_check_constraint.sql
-- BUG CRITIQUE : la contrainte CHECK sur profiles.plan posée par la
-- migration 009 n'autorisait que ('free', 'plus', 'famille') — les
-- anciens noms de plans. Depuis le passage au système Starter/Pro,
-- toute tentative d'UPDATE profiles SET plan = 'starter' ou 'pro'
-- (webhooks LemonSqueezy/Stripe, cron de recharge Novas) viole cette
-- contrainte et échoue avec une erreur Postgres. Comme le code des
-- webhooks n'inspectait pas le résultat de l'update, l'échec était
-- totalement silencieux : le webhook répondait quand même 200 OK,
-- laissant croire que l'abonnement avait été activé alors que la
-- colonne `plan` restait bloquée sur 'free' en base.
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro'));

-- Migration des valeurs historiques encore présentes en base
-- ('plus' = ancien plan payant unique -> mappé sur 'starter').
UPDATE public.profiles SET plan = 'starter' WHERE plan = 'plus';
UPDATE public.profiles SET plan = 'free'    WHERE plan NOT IN ('free', 'starter', 'pro');
