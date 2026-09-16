-- ═══════════════════════════════════════════════════════════════════════════
-- Rate limit : incrément atomique (plus de course au premier appel)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Vu en prod le 2026-09-16 : trois appels simultanés d'un même utilisateur
-- (QcmGenerator lance les 3 niveaux en parallèle) tombaient tous sur
-- « NOT FOUND », inséraient chacun leur ligne, et le second levait
-- « duplicate key value violates unique constraint rate_limits_pkey ».
-- checkRateLimit() traite une erreur comme « laisser passer » : le plafond
-- était contournable précisément au moment où il compte.
--
-- Un seul INSERT ... ON CONFLICT DO UPDATE fait tout : création, reset de
-- fenêtre expirée, incrément — sous le verrou de ligne de Postgres.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_user_id        uuid,
  p_endpoint       text,
  p_limit          integer,
  p_window_seconds integer,
  p_amount         integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_now          timestamptz := now();
  v_window       interval    := (p_window_seconds || ' seconds')::interval;
  v_amount       integer     := GREATEST(1, COALESCE(p_amount, 1));
  v_count        integer;
  v_window_start timestamptz;
BEGIN
  INSERT INTO rate_limits (user_id, endpoint, window_start, count)
  VALUES (p_user_id, p_endpoint, v_now, v_amount)
  ON CONFLICT (user_id, endpoint) DO UPDATE SET
    count = CASE
      WHEN rate_limits.window_start + v_window <= v_now THEN v_amount          -- fenêtre expirée : repart
      ELSE rate_limits.count + v_amount
    END,
    window_start = CASE
      WHEN rate_limits.window_start + v_window <= v_now THEN v_now
      ELSE rate_limits.window_start
    END
  RETURNING count, window_start INTO v_count, v_window_start;

  RETURN jsonb_build_object(
    'allowed',      v_count <= p_limit,
    'count',        v_count,
    'window_start', v_window_start,
    'reset_at',     v_window_start + v_window
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
