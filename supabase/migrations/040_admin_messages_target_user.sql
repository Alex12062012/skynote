-- ═══════════════════════════════════════════════════════════════════════════
-- Message du jour ciblé sur un utilisateur
-- ═══════════════════════════════════════════════════════════════════════════
--
-- target_user_id NULL  = broadcast (comportement de la migration 036),
-- target_user_id = X   = visible uniquement par X, à sa prochaine connexion.
-- Créé depuis la fiche admin d'un utilisateur, au moment d'un crédit
-- Novas / Sky Coins (« Voici 100 Novas suite au bug du 16/09 »).
-- Plusieurs messages ciblés peuvent être actifs en même temps (un par
-- utilisateur) ; la règle « un seul actif » ne vaut que pour les broadcasts.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.admin_messages
  ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS admin_messages_target_user_idx
  ON public.admin_messages (target_user_id) WHERE target_user_id IS NOT NULL AND active;

-- Lecture client : ses messages ciblés + les broadcasts, actifs seulement.
DROP POLICY IF EXISTS "Users read active admin messages" ON public.admin_messages;
CREATE POLICY "Users read active admin messages" ON public.admin_messages
  FOR SELECT TO authenticated
  USING (active = true AND (target_user_id IS NULL OR target_user_id = auth.uid()));

-- Un message ciblé passe avant un broadcast (LIMIT 1 : le suivant s'affichera
-- à la connexion d'après).
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
    AND (m.target_user_id IS NULL OR m.target_user_id = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.user_seen_messages s
      WHERE s.message_id = m.id AND s.user_id = auth.uid()
    )
  ORDER BY (m.target_user_id IS NOT NULL) DESC, m.created_at DESC
  LIMIT 1;
$$;
