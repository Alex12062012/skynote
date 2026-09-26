-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif de 045 : « column reference "course_id" is ambiguous »
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Attrapé au premier appel réel du réconciliateur en prod, avant de brancher
-- le cron. En plpgsql, les colonnes déclarées par RETURNS TABLE deviennent des
-- variables : `course_id` dans la liste de colonnes de l'INSERT et dans le
-- ON CONFLICT était donc ambigu entre la colonne et la variable.
--
-- Une fonction LANGUAGE sql n'a pas de variables, donc pas de collision
-- possible. Les CTE utilisent en plus des alias distincts (cid / uid / lvl)
-- pour que le problème ne puisse pas se reformer à la prochaine retouche.
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS claim_qcm_fill_targets(integer, integer, integer);

CREATE FUNCTION claim_qcm_fill_targets(
  p_limit           integer DEFAULT 3,
  p_max_attempts    integer DEFAULT 8,
  p_backoff_seconds integer DEFAULT 120
)
RETURNS TABLE (course_id uuid, user_id uuid, difficulty text)
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  WITH fiches AS (
    SELECT f.course_id AS cid, f.user_id AS uid, count(*)::int AS n
    FROM flashcards f
    JOIN courses c ON c.id = f.course_id AND c.status = 'ready'
    GROUP BY f.course_id, f.user_id
  ),
  levels AS (
    SELECT unnest(ARRAY['peaceful', 'easy', 'medium']) AS lvl
  ),
  done AS (
    SELECT q.course_id AS cid, q.difficulty AS lvl, count(DISTINCT q.flashcard_id)::int AS k
    FROM qcm_questions q
    GROUP BY q.course_id, q.difficulty
  ),
  incomplete AS (
    SELECT fi.cid, fi.uid, l.lvl
    FROM fiches fi
    CROSS JOIN levels l
    LEFT JOIN done d ON d.cid = fi.cid AND d.lvl = l.lvl
    WHERE coalesce(d.k, 0) < fi.n
  ),
  eligible AS (
    SELECT i.cid, i.uid, i.lvl
    FROM incomplete i
    LEFT JOIN qcm_fill_attempts a ON a.course_id = i.cid AND a.difficulty = i.lvl
    WHERE coalesce(a.attempts, 0) < p_max_attempts
      AND (a.last_at IS NULL OR a.last_at < now() - (p_backoff_seconds || ' seconds')::interval)
    ORDER BY coalesce(a.attempts, 0), i.cid, i.lvl
    LIMIT p_limit
  ),
  -- CTE modifiante : Postgres l'exécute toujours, une fois et jusqu'au bout,
  -- même si la requête principale ne lit pas sa sortie.
  stamped AS (
    INSERT INTO qcm_fill_attempts AS t (course_id, difficulty, attempts, last_at)
    SELECT e.cid, e.lvl, 1, now() FROM eligible e
    ON CONFLICT (course_id, difficulty) DO UPDATE
      SET attempts = t.attempts + 1, last_at = now()
    RETURNING t.course_id
  )
  SELECT e.cid, e.uid, e.lvl FROM eligible e;
$$;

NOTIFY pgrst, 'reload schema';
