-- Table de rate limiting persistante
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     text        NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint)
);

-- Pas de RLS public : accessible uniquement via service role depuis les API routes
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Index pour les expirations (nettoyage futur)
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits (window_start);

-- Fonction atomique : lecture + reset si fenêtre expirée + incrément
-- Utilise FOR UPDATE pour éviter les race conditions sous charge concurrente.
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_user_id       uuid,
  p_endpoint      text,
  p_limit         integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_now        timestamptz := now();
  v_row        rate_limits%ROWTYPE;
  v_new_count  integer;
  v_reset_at   timestamptz;
BEGIN
  -- Verrouille la ligne pour cet utilisateur+endpoint (élimine les race conditions)
  SELECT * INTO v_row
    FROM rate_limits
   WHERE user_id = p_user_id AND endpoint = p_endpoint
     FOR UPDATE;

  IF NOT FOUND THEN
    -- Première requête : insère directement
    INSERT INTO rate_limits (user_id, endpoint, window_start, count)
    VALUES (p_user_id, p_endpoint, v_now, 1);

    RETURN jsonb_build_object(
      'allowed',       true,
      'count',         1,
      'window_start',  v_now,
      'reset_at',      v_now + (p_window_seconds || ' seconds')::interval
    );
  END IF;

  v_reset_at := v_row.window_start + (p_window_seconds || ' seconds')::interval;

  IF v_reset_at <= v_now THEN
    -- Fenêtre expirée : repart à 1
    UPDATE rate_limits
       SET window_start = v_now, count = 1
     WHERE user_id = p_user_id AND endpoint = p_endpoint;

    RETURN jsonb_build_object(
      'allowed',       true,
      'count',         1,
      'window_start',  v_now,
      'reset_at',      v_now + (p_window_seconds || ' seconds')::interval
    );
  END IF;

  -- Fenêtre active : incrément
  v_new_count := v_row.count + 1;

  UPDATE rate_limits
     SET count = v_new_count
   WHERE user_id = p_user_id AND endpoint = p_endpoint;

  RETURN jsonb_build_object(
    'allowed',       v_new_count <= p_limit,
    'count',         v_new_count,
    'window_start',  v_row.window_start,
    'reset_at',      v_reset_at
  );
END;
$$;
