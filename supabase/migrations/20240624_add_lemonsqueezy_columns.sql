-- Migration : ajout des colonnes LemonSqueezy sur la table profiles
-- À exécuter dans Supabase Dashboard → SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ls_customer_id     text,
  ADD COLUMN IF NOT EXISTS ls_subscription_id text;

-- Index pour les lookups webhook
CREATE INDEX IF NOT EXISTS idx_profiles_ls_subscription_id
  ON profiles (ls_subscription_id);

CREATE INDEX IF NOT EXISTS idx_profiles_ls_customer_id
  ON profiles (ls_customer_id);
