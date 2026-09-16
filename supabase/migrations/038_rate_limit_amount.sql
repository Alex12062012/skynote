-- ═══════════════════════════════════════════════════════════════════════════
-- Rate limit : incrément de N unités en un appel
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Constat du 2026-09-16 : la migration 20260610_rate_limits n'avait JAMAIS
-- été appliquée en prod (« Could not find the function
-- check_and_increment_rate_limit »). checkRateLimit() échouait en mode
-- « laisser passer » : aucun plafond (chat, génération, QCM) n'était actif.
-- Elle est appliquée en même temps que celle-ci.
--
-- p_amount : la route /api/generate-qcm/level lance un appel Claude par
-- fiche ; elle consomme donc autant d'unités que de fiches, pour que les
-- plafonds 40/h et 200/jour gardent le sens « par appel IA ».
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
  v_now        timestamptz := now();
  v_row        rate_limits%ROWTYPE;
  v_new_count  integer;
  v_reset_at   timestamptz;
  v_amount     integer := GREATEST(1, COALESCE(p_amount, 1));
BEGIN
  SELECT * INTO v_row
    FROM rate_limits
   WHERE user_id = p_user_id AND endpoint = p_endpoint
     FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (user_id, endpoint, window_start, count)
    VALUES (p_user_id, p_endpoint, v_now, v_amount);
    RETURN jsonb_build_object(
      'allowed',      v_amount <= p_limit,
      'count',        v_amount,
      'window_start', v_now,
      'reset_at',     v_now + (p_window_seconds || ' seconds')::interval
    );
  END IF;

  v_reset_at := v_row.window_start + (p_window_seconds || ' seconds')::interval;

  IF v_reset_at <= v_now THEN
    UPDATE rate_limits SET window_start = v_now, count = v_amount
     WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN jsonb_build_object(
      'allowed',      v_amount <= p_limit,
      'count',        v_amount,
      'window_start', v_now,
      'reset_at',     v_now + (p_window_seconds || ' seconds')::interval
    );
  END IF;

  v_new_count := v_row.count + v_amount;
  UPDATE rate_limits SET count = v_new_count
   WHERE user_id = p_user_id AND endpoint = p_endpoint;

  RETURN jsonb_build_object(
    'allowed',      v_new_count <= p_limit,
    'count',        v_new_count,
    'window_start', v_row.window_start,
    'reset_at',     v_reset_at
  );
END;
$$;

-- L'ancienne signature (4 paramètres) est remplacée : une seule fonction,
-- p_amount optionnel, les appels existants restent valides.
DROP FUNCTION IF EXISTS check_and_increment_rate_limit(uuid, text, integer, integer);

NOTIFY pgrst, 'reload schema';
