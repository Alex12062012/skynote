-- ============================================================
-- 028_webhook_idempotency.sql
-- Empêche le double-traitement des webhooks (LemonSqueezy / Stripe)
-- en cas de replay (timeout, cold start Vercel, erreur réseau côté
-- provider qui déclenche un renvoi automatique du même événement).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           text PRIMARY KEY,             -- clé unique de dédup : "<provider>:<event_id>"
  provider     text NOT NULL,                -- 'lemonsqueezy' | 'stripe'
  event_name   text,
  received_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy pour anon/authenticated : uniquement accessible via service_role
-- (les webhooks tournent toujours avec le client service_role).
