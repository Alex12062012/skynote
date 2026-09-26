-- ═══════════════════════════════════════════════════════════════════════════
-- Reconciliation des QCM : la file d'attente des niveaux incomplets
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Pourquoi une file en base plutot qu'un simple retry dans la requete HTTP :
-- une fonction Vercel est tuee a maxDuration (60 s sur le plan Hobby) et le
-- modele peut rater sa sortie un nombre non borne de fois. Tant que le seul
-- moteur est la requete de l'eleve, il reste une probabilite non nulle de
-- niveau incomplet — et elle devient une certitude si l'eleve ferme l'onglet
-- pendant la generation (les QCM sont declenches par le navigateur).
--
-- La garantie vient donc de la CONVERGENCE : une operation idempotente
-- (fillQcmLevel ne remplit que ce qui manque) + un moteur qui la relance
-- jusqu'a completude. pg_cron joue ce moteur, toutes les minutes, cote
-- serveur, independamment du navigateur.
--
-- Releve du 2026-09-26 avant ce correctif : sur les cours crees depuis le
-- 17/09, 3 couples (cours, niveau) sur 15 restaient partiels — 20 %.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS qcm_fill_attempts (
  course_id  uuid        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  difficulty text        NOT NULL,
  attempts   integer     NOT NULL DEFAULT 0,
  last_at    timestamptz,
  PRIMARY KEY (course_id, difficulty)
);

ALTER TABLE qcm_fill_attempts ENABLE ROW LEVEL SECURITY;
-- Aucune policy : table purement serveur (service role), comme rate_limits
-- et generation_locks.

CREATE INDEX IF NOT EXISTS qcm_fill_attempts_last_at_idx ON qcm_fill_attempts (last_at);

-- ───────────────────────────────────────────────────────────────────────────
-- Reserve atomiquement jusqu'a p_limit couples (cours, niveau) incomplets.
--
-- « Incomplet » est calcule sur les donnees, pas sur courses.qcm_status : ce
-- dernier est pose de façon optimiste par le client et ne fait pas foi.
--
-- Le compteur de tentatives borne le cout : un cours dont le contenu ne
-- permet tout simplement pas de generer des QCM valides ne doit pas tourner
-- en boucle sur la facture Anthropic. Le backoff evite que deux passages du
-- cron se disputent la meme cible (le bail de 042 le garantit deja, mais
-- autant ne pas gaspiller l'invocation).
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_qcm_fill_targets(
  p_limit           integer DEFAULT 3,
  p_max_attempts    integer DEFAULT 8,
  p_backoff_seconds integer DEFAULT 120
)
RETURNS TABLE (course_id uuid, user_id uuid, difficulty text)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH fiches AS (
    SELECT f.course_id, f.user_id, count(*)::int AS n
    FROM flashcards f
    JOIN courses c ON c.id = f.course_id AND c.status = 'ready'
    GROUP BY f.course_id, f.user_id
  ),
  levels AS (
    SELECT unnest(ARRAY['peaceful', 'easy', 'medium']) AS difficulty
  ),
  done AS (
    SELECT q.course_id, q.difficulty, count(DISTINCT q.flashcard_id)::int AS k
    FROM qcm_questions q
    GROUP BY q.course_id, q.difficulty
  ),
  incomplete AS (
    SELECT fi.course_id, fi.user_id, l.difficulty
    FROM fiches fi
    CROSS JOIN levels l
    LEFT JOIN done d ON d.course_id = fi.course_id AND d.difficulty = l.difficulty
    WHERE coalesce(d.k, 0) < fi.n
  ),
  eligible AS (
    SELECT i.course_id, i.user_id, i.difficulty, coalesce(a.attempts, 0) AS attempts
    FROM incomplete i
    LEFT JOIN qcm_fill_attempts a
      ON a.course_id = i.course_id AND a.difficulty = i.difficulty
    WHERE coalesce(a.attempts, 0) < p_max_attempts
      AND (a.last_at IS NULL OR a.last_at < now() - (p_backoff_seconds || ' seconds')::interval)
    ORDER BY coalesce(a.attempts, 0), i.course_id, i.difficulty
    LIMIT p_limit
  ),
  -- CTE modifiante : Postgres l'execute toujours, une fois et jusqu'au bout,
  -- meme si la requete principale ne lit pas sa sortie.
  stamped AS (
    INSERT INTO qcm_fill_attempts AS t (course_id, difficulty, attempts, last_at)
    SELECT e.course_id, e.difficulty, 1, now() FROM eligible e
    ON CONFLICT (course_id, difficulty) DO UPDATE
      SET attempts = t.attempts + 1, last_at = now()
    RETURNING t.course_id, t.difficulty
  )
  SELECT e.course_id, e.user_id, e.difficulty FROM eligible e;
END;
$$;

-- Remise a zero quand un niveau redevient a remplir legitimement (le cours a
-- ete regenere, ou une regeneration payante a vide un niveau) : sans ca, le
-- compteur de tentatives d'hier bloquerait la reconciliation d'aujourd'hui.
CREATE OR REPLACE FUNCTION reset_qcm_fill_attempts(p_course_id uuid, p_difficulty text)
RETURNS void
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  DELETE FROM qcm_fill_attempts
  WHERE course_id = p_course_id AND difficulty = p_difficulty;
$$;

NOTIFY pgrst, 'reload schema';

-- ───────────────────────────────────────────────────────────────────────────
-- Sonde de supervision : l'indicateur a surveiller. Doit tendre vers 0.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION count_incomplete_qcm_levels()
RETURNS jsonb
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  WITH fiches AS (
    SELECT f.course_id, count(*)::int AS n
    FROM flashcards f
    JOIN courses c ON c.id = f.course_id AND c.status = 'ready'
    GROUP BY f.course_id
  ),
  levels AS (SELECT unnest(ARRAY['peaceful', 'easy', 'medium']) AS difficulty),
  done AS (
    SELECT q.course_id, q.difficulty, count(DISTINCT q.flashcard_id)::int AS k
    FROM qcm_questions q GROUP BY q.course_id, q.difficulty
  ),
  couples AS (
    SELECT fi.course_id, l.difficulty, fi.n, coalesce(d.k, 0) AS k
    FROM fiches fi
    CROSS JOIN levels l
    LEFT JOIN done d ON d.course_id = fi.course_id AND d.difficulty = l.difficulty
  )
  SELECT jsonb_build_object(
    'couples',    count(*),
    'complets',   count(*) FILTER (WHERE k >= n),
    'partiels',   count(*) FILTER (WHERE k > 0 AND k < n),
    'vides',      count(*) FILTER (WHERE k = 0),
    'pct_complet', round(100.0 * count(*) FILTER (WHERE k >= n) / greatest(count(*), 1), 1),
    'epuises',    (SELECT count(*) FROM qcm_fill_attempts WHERE attempts >= 8)
  )
  FROM couples;
$$;

NOTIFY pgrst, 'reload schema';
