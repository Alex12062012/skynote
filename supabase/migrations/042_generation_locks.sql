-- ═══════════════════════════════════════════════════════════════════════════
-- Verrou atomique sur la génération IA (fin des fiches et QCM en double)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Constaté en prod (relevé le 2026-09-26) :
--   cours 274cdcdd-… du 24/09 → 8 fiches, order_index 0,1,2,3 DEUX fois,
--   en 2 instructions INSERT distinctes à 1,46 s d'écart, et DEUX débits de
--   118✦ à 453 ms d'écart. Le plafond MAX_FLASHCARDS=4 était donc respecté :
--   ce n'est pas l'IA qui débordait, c'est le pipeline qui a tourné deux fois.
--   Idem sur qcm_questions : 10 questions par (fiche, niveau) en 2 INSERT,
--   jamais en un seul de 10.
--
-- Cause : les gardes « existingFlashcards > 0 » / « alreadyDone » sont un
-- read-then-write. Deux requêtes concurrentes lisent toutes les deux « rien
-- en base », puis écrivent toutes les deux. Exactement la classe de bug déjà
-- corrigée sur rate_limits par la migration 039 — même remède : une seule
-- instruction SQL, sous le verrou de ligne de Postgres.
--
-- Bail (lease) plutôt que verrou permanent : un process qui meurt (timeout
-- Vercel 60 s, cold start, rollback) ne doit pas bloquer le cours pour
-- toujours. Passé le TTL, le bail se reprend tout seul.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS generation_locks (
  lock_key    text        PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE generation_locks ENABLE ROW LEVEL SECURITY;
-- Aucune policy : table purement serveur (service role uniquement), comme
-- rate_limits. Le client n'a jamais à la lire ni à l'écrire.

CREATE INDEX IF NOT EXISTS generation_locks_acquired_at_idx
  ON generation_locks (acquired_at);

-- ───────────────────────────────────────────────────────────────────────────
-- Prise de bail atomique : true = c'est à toi de générer, false = quelqu'un
-- d'autre est déjà dessus. Tout se joue dans le seul INSERT .. ON CONFLICT :
-- le second appelant est bloqué sur le verrou de ligne, puis voit le WHERE
-- échouer et ne remonte aucune ligne.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION try_acquire_generation_lock(
  p_lock_key    text,
  p_user_id     uuid,
  p_ttl_seconds integer DEFAULT 120
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_acquired boolean := false;
BEGIN
  -- Purge opportuniste : un process tué avant son release laisse sa ligne
  -- derrière lui. Le TTL la rend reprenable, mais rien ne la supprimerait
  -- jamais si personne ne redemande cette clé. Balayage indexé, une fois par
  -- génération : la table reste petite sans cron.
  DELETE FROM generation_locks WHERE acquired_at < now() - interval '1 hour';

  INSERT INTO generation_locks (lock_key, user_id, acquired_at)
  VALUES (p_lock_key, p_user_id, now())
  ON CONFLICT (lock_key) DO UPDATE
    SET user_id     = EXCLUDED.user_id,
        acquired_at = now()
    WHERE generation_locks.acquired_at
          < now() - (p_ttl_seconds || ' seconds')::interval
  RETURNING true INTO v_acquired;

  RETURN COALESCE(v_acquired, false);
END;
$$;

CREATE OR REPLACE FUNCTION release_generation_lock(p_lock_key text)
RETURNS void
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  DELETE FROM generation_locks WHERE lock_key = p_lock_key;
$$;

NOTIFY pgrst, 'reload schema';
