-- ═══════════════════════════════════════════════════════════════════════════
-- Message du jour (admin)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- L'admin rédige un message, l'active, et chaque utilisateur le voit UNE fois
-- en popup au chargement du dashboard. Une récompense optionnelle (Sky Coins
-- ou Novas) est créditée quand l'utilisateur clique OK.
--
-- Modèle de menace :
--  1. La récompense vaut de l'argent (Novas) : elle n'est créditée que par la
--     route serveur /api/messages/ack, via service_role, et une seule fois par
--     (user, message) grâce à la clé primaire composite de user_seen_messages.
--  2. Un client ne peut lire que les messages ACTIFS (pas les brouillons ni
--     l'historique) et ne peut écrire que sa propre ligne « vu ».
--  3. Toute écriture sur admin_messages passe par service_role (route admin
--     qui revérifie ADMIN_EMAILS) : aucune policy INSERT/UPDATE côté client.
--
-- TODO produit (décision ouverte) : fréquence d'affichage (une fois vs
-- répétable) et ciblage par segment (plan, classe…). Version actuelle :
-- une fois par utilisateur, tous les utilisateurs.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  content       text        NOT NULL CHECK (length(btrim(content)) BETWEEN 1 AND 2000),
  reward_type   text        CHECK (reward_type IN ('sky_coins', 'nova')),
  reward_amount integer     CHECK (reward_amount IS NULL OR reward_amount BETWEEN 1 AND 100000),
  active        boolean     NOT NULL DEFAULT false,
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- Type et montant vont ensemble : pas de récompense à moitié définie.
  CONSTRAINT admin_messages_reward_coherente
    CHECK ((reward_type IS NULL) = (reward_amount IS NULL))
);

CREATE TABLE IF NOT EXISTS public.user_seen_messages (
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id  uuid        NOT NULL REFERENCES public.admin_messages(id) ON DELETE CASCADE,
  seen_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, message_id)
);

CREATE INDEX IF NOT EXISTS admin_messages_active_idx
  ON public.admin_messages (created_at DESC) WHERE active;

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.admin_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_seen_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read active admin messages" ON public.admin_messages;
CREATE POLICY "Users read active admin messages" ON public.admin_messages
  FOR SELECT TO authenticated USING (active = true);

DROP POLICY IF EXISTS "Users read own seen messages" ON public.user_seen_messages;
CREATE POLICY "Users read own seen messages" ON public.user_seen_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- L'insertion « vu » passe par la route serveur (service_role) pour rester
-- atomique avec le crédit de la récompense : pas de policy INSERT client.

-- ─── Message actif non encore vu par l'utilisateur courant ─────────────────
-- Une seule requête depuis le layout (au lieu de deux dépendantes).

CREATE OR REPLACE FUNCTION public.get_unseen_admin_message()
RETURNS TABLE (id uuid, content text, reward_type text, reward_amount integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT m.id, m.content, m.reward_type, m.reward_amount
  FROM public.admin_messages m
  WHERE m.active
    AND NOT EXISTS (
      SELECT 1 FROM public.user_seen_messages s
      WHERE s.message_id = m.id AND s.user_id = auth.uid()
    )
  ORDER BY m.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_unseen_admin_message() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unseen_admin_message() TO authenticated, service_role;
