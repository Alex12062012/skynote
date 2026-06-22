-- ============================================================
-- 024_nova_wallet.sql
-- Système de Novas — monnaie d'usage des fonctionnalités IA
-- ============================================================
-- Les Novas (✦) sont déduites à chaque appel IA :
--   OCR       : 2 ✦
--   Fiches    : 30 ✦
--   QCM batch : 88 ✦
--   Chat msg  : 36 ✦
-- Allocation mensuelle selon le plan :
--   free    : 600 ✦ une fois à l'inscription
--   starter : 2 000 ✦/mois
--   pro     : 4 000 ✦/mois
-- ============================================================

-- ─── TABLE WALLETS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  user_id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  novas_balance   BIGINT NOT NULL DEFAULT 0 CHECK (novas_balance >= 0),
  novas_lifetime  BIGINT NOT NULL DEFAULT 0,  -- total gagné depuis l'inscription
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture wallet propre" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pas de modification directe" ON wallets
  FOR ALL USING (false);

-- ─── TABLE NOVA_TRANSACTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS nova_transactions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount      BIGINT NOT NULL,   -- positif = crédit, négatif = débit
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nova_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture transactions propres" ON nova_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS nova_transactions_user_idx ON nova_transactions (user_id, created_at DESC);

-- ─── FONCTION : add_novas ───────────────────────────────────
-- Crédite des Novas sur le wallet de l'utilisateur.
-- Crée le wallet s'il n'existe pas encore (robustesse).
CREATE OR REPLACE FUNCTION add_novas(
  p_user_id UUID,
  p_amount   BIGINT,
  p_reason   TEXT DEFAULT NULL
)
RETURNS BIGINT   -- nouveau solde
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance BIGINT;
BEGIN
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

-- ─── FONCTION : deduct_novas ────────────────────────────────
-- Déduit des Novas du wallet. Lève une exception si solde insuffisant.
CREATE OR REPLACE FUNCTION deduct_novas(
  p_user_id UUID,
  p_amount   BIGINT,
  p_reason   TEXT DEFAULT NULL
)
RETURNS BIGINT   -- nouveau solde
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  -- Verrou ligne pour éviter les race conditions
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

-- ─── TRIGGER : créer wallet à l'inscription ─────────────────
-- Donne 600 Novas (une fois) aux nouveaux inscrits (plan free).
CREATE OR REPLACE FUNCTION handle_new_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO wallets (user_id, novas_balance, novas_lifetime)
  VALUES (NEW.id, 600, 600)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO nova_transactions (user_id, amount, reason)
  VALUES (NEW.id, 600, 'Bienvenue — 600 Novas offerts');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_wallet();

-- ─── BACKFILL wallets pour utilisateurs existants ───────────
-- Crée un wallet avec 600 Novas pour tous les users sans wallet.
INSERT INTO wallets (user_id, novas_balance, novas_lifetime)
SELECT id, 600, 600
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;
