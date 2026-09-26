-- ═══════════════════════════════════════════════════════════════════════════
-- Le moteur de la reconciliation : pg_cron, toutes les minutes
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Pourquoi pg_cron et pas Vercel Cron : le compte est sur le plan Hobby, ou
-- Vercel n'autorise qu'UNE execution par jour. Un cours incomplet resterait
-- incomplet jusqu'au lendemain. pg_cron tourne a la minute, est deja dans la
-- stack (Supabase), et ne coute rien de plus.
--
-- Pourquoi pas un simple retry dans la requete de l'eleve : voir 045. Resume —
-- la fonction Vercel est tuee a 60 s, le modele peut rater sa sortie un nombre
-- non borne de fois, et l'eleve peut fermer l'onglet. Aucun de ces trois cas
-- ne se corrige en agrandissant le budget d'une requete.
--
-- Le secret et l'URL ne sont PAS dans ce fichier : ils vivent dans app_config,
-- renseignee hors depot. Un migration committee ne doit jamais porter de
-- secret.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Config serveur (URL + secret du reconciliateur). Aucune policy RLS : seul le
-- service role et les jobs cron y accedent, jamais le client.
CREATE TABLE IF NOT EXISTS app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- Un appel non bloquant par minute. pg_net poste en asynchrone : le job cron
-- rend la main tout de suite, il n'attend pas les 50 s de generation.
--
-- Le job ne fait rien si la config est absente (deploiement partiel, projet
-- clone) : coalesce sur une URL vide et net.http_post n'est jamais appele.
-- ───────────────────────────────────────────────────────────────────────────
DO $do$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'qcm-reconcile') INTO v_exists;
  IF v_exists THEN
    PERFORM cron.unschedule('qcm-reconcile');
  END IF;
END
$do$;

SELECT cron.schedule(
  'qcm-reconcile',
  '* * * * *',
  $job$
  SELECT net.http_post(
    url     := (SELECT value FROM app_config WHERE key = 'qcm_reconcile_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reconcile-secret', (SELECT value FROM app_config WHERE key = 'qcm_reconcile_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 55000
  )
  WHERE EXISTS (SELECT 1 FROM app_config WHERE key = 'qcm_reconcile_url')
    AND EXISTS (SELECT 1 FROM app_config WHERE key = 'qcm_reconcile_secret');
  $job$
);
