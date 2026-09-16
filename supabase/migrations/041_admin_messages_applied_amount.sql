-- ═══════════════════════════════════════════════════════════════════════════
-- Message ciblé : montant déjà appliqué, affiché en badge
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Un crédit / retrait admin (add_coins, add_novas) est appliqué immédiatement
-- par l'action admin. Le message qui l'accompagne doit afficher ce montant en
-- badge — sans le concaténer dans le texte, et SANS passer par
-- reward_type / reward_amount : ces colonnes déclenchent un crédit dans
-- /api/messages/ack, ce serait un double crédit.
--
-- D'où deux colonnes dédiées, purement informatives : applied_amount peut
-- être négatif (retrait). /api/messages/ack ne les lit pas.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.admin_messages
  ADD COLUMN IF NOT EXISTS applied_type   text    CHECK (applied_type IN ('sky_coins', 'nova')),
  ADD COLUMN IF NOT EXISTS applied_amount integer CHECK (applied_amount IS NULL OR applied_amount <> 0);

ALTER TABLE public.admin_messages
  DROP CONSTRAINT IF EXISTS admin_messages_applied_coherent,
  ADD CONSTRAINT admin_messages_applied_coherent
    CHECK ((applied_type IS NULL) = (applied_amount IS NULL));

-- Le RPC renvoie les deux paires ; le type de retour change, il faut DROP.
DROP FUNCTION IF EXISTS public.get_unseen_admin_message();
CREATE FUNCTION public.get_unseen_admin_message()
RETURNS TABLE (id uuid, content text, reward_type text, reward_amount integer, applied_type text, applied_amount integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT m.id, m.content, m.reward_type, m.reward_amount, m.applied_type, m.applied_amount
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
REVOKE ALL ON FUNCTION public.get_unseen_admin_message() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unseen_admin_message() TO authenticated, service_role;
