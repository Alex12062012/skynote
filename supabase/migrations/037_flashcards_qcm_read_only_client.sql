-- ═══════════════════════════════════════════════════════════════════════════
-- flashcards et qcm_questions : lecture seule pour le client
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Les policies « Users own X » FOR ALL (migration 002) laissaient un
-- utilisateur ecrire directement ces tables depuis le navigateur (cle anon +
-- son JWT) : vider ses qcm_questions en console puis rappeler
-- /api/generate-qcm gratuitement en boucle, ou inserer des flashcards
-- arbitraires. Ces tables ne sont produites que par la logique serveur.
--
-- Desormais : SELECT seul pour le client. Toute ecriture passe par le
-- service role cote serveur (createAdminClient), apres verification de
-- l'appartenance. Les policies de lecture prof/eleve (008, classroom) sont
-- inchangees. Les cascades ON DELETE (suppression d'un cours) ne sont pas
-- soumises a RLS et continuent de fonctionner.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users own flashcards" ON public.flashcards;
CREATE POLICY "Users read own flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own qcm_questions" ON public.qcm_questions;
CREATE POLICY "Users read own qcm_questions" ON public.qcm_questions
  FOR SELECT USING (auth.uid() = user_id);
