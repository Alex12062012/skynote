-- ============================================================
-- 025_secure_currency_rpcs.sql
-- FIX SÉCURITÉ CRITIQUE
-- ============================================================
-- Problème : increment_coins, award_coins, spend_coins,
-- perform_prestige, add_novas, deduct_novas sont SECURITY DEFINER
-- (bypass RLS) et Postgres/PostgREST les exposait par défaut à
-- anon + authenticated via /rest/v1/rpc/<nom>. N'importe quel
-- utilisateur connecté pouvait donc appeler ces fonctions
-- directement (hors app, avec son propre JWT) avec un p_user_id
-- et un p_amount arbitraires -> coins/Novas illimités gratuits.
--
-- Fix 1 : réserver l'exécution de ces RPC au rôle service_role
-- (utilisé uniquement côté serveur, jamais exposé au navigateur).
-- Le code applicatif est mis à jour en parallèle (hors SQL) pour
-- appeler ces RPC via un client service_role après avoir vérifié
-- l'identité de l'utilisateur côté serveur.
--
-- Fix 2 : deduct_novas et add_novas ne validaient pas p_amount > 0
-- -> un montant négatif inversait l'opération (deduct négatif =
-- crédit, add négatif = débit qui pouvait viser le wallet de
-- quelqu'un d'autre).
--
-- Fix 3 : la policy RLS "profiles update = auth.uid() = id" ne
-- restreint aucune colonne -> n'importe qui pouvait faire
-- .update({ plan: 'pro', sky_coins: 999999 }) sur son propre
-- profil avec le client standard. Trigger qui verrouille les
-- colonnes sensibles hors service_role.
-- ============================================================

-- ─── 1. Verrouillage des RPC monnaie/prestige ────────────────
REVOKE EXECUTE ON FUNCTION public.increment_coins(uuid, integer)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_coins(uuid, integer, text)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.spend_coins(uuid, integer, text)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.perform_prestige(uuid)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_novas(uuid, bigint, text)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_novas(uuid, bigint, text)    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_coins(uuid, integer)       TO service_role;
GRANT EXECUTE ON FUNCTION public.award_coins(uuid, integer, text)     TO service_role;
GRANT EXECUTE ON FUNCTION public.spend_coins(uuid, integer, text)     TO service_role;
GRANT EXECUTE ON FUNCTION public.perform_prestige(uuid)               TO service_role;
GRANT EXECUTE ON FUNCTION public.add_novas(uuid, bigint, text)        TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_novas(uuid, bigint, text)     TO service_role;

-- ─── 2. Validation p_amount sur add_novas / deduct_novas ─────
CREATE OR REPLACE FUNCTION public.deduct_novas(
  p_user_id UUID,
  p_amount   BIGINT,
  p_reason   TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'deduct_novas: amount must be > 0';
  END IF;

  SELECT novas_balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_novas';
  END IF;

  UPDATE wallets
  SET novas_balance = novas_balance - p_amount,
      updated_at    = now()
  WHERE user_id = p_user_id;

  INSERT INTO nova_transactions (user_id, amount, reason)
  VALUES (p_user_id, -p_amount, p_reason);

  RETURN v_balance - p_amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_novas(
  p_user_id UUID,
  p_amount   BIGINT,
  p_reason   TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'add_novas: amount must be > 0';
  END IF;

  INSERT INTO wallets (user_id, novas_balance, novas_lifetime)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET novas_balance  = wallets.novas_balance  + p_amount,
        novas_lifetime = wallets.novas_lifetime + p_amount,
        updated_at     = now();

  SELECT novas_balance INTO v_balance FROM wallets WHERE user_id = p_user_id;

  INSERT INTO nova_transactions (user_id, amount, reason)
  VALUES (p_user_id, p_amount, p_reason);

  RETURN v_balance;
END;
$$;

-- ─── 3. Verrouillage des colonnes sensibles sur profiles ─────
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Le service_role (webhooks Stripe/LemonSqueezy, cron, admin) garde la main.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Pour authenticated/anon : ces colonnes ne peuvent pas être modifiées
  -- via un update direct, quoi que le client envoie. Seules les RPC
  -- sécurisées (désormais service_role only) ou les webhooks peuvent
  -- les changer.
  NEW.plan                := OLD.plan;
  NEW.plan_expires_at     := OLD.plan_expires_at;
  NEW.sky_coins           := OLD.sky_coins;
  NEW.total_coins_earned  := OLD.total_coins_earned;
  NEW.weekly_coins        := OLD.weekly_coins;
  NEW.monthly_coins       := OLD.monthly_coins;
  NEW.prestige_level      := OLD.prestige_level;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_sensitive_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_columns();
