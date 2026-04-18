-- 011 : Policies pour que le prof puisse lire les stats de ses eleves

-- Le prof peut lire les profils des eleves de sa classe
CREATE POLICY "Teachers read student profiles" ON profiles
  FOR SELECT USING (
    classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
  );

-- Le prof peut lire les tentatives QCM des eleves de sa classe
CREATE POLICY "Teachers read student qcm_attempts" ON qcm_attempts
  FOR SELECT USING (
    user_id IN (
      SELECT p.id FROM profiles p
      JOIN classrooms c ON p.classroom_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Le prof peut lire les sessions de quiz liste des eleves
CREATE POLICY "Teachers read student list_quiz_sessions" ON list_quiz_sessions
  FOR SELECT USING (
    user_id IN (
      SELECT p.id FROM profiles p
      JOIN classrooms c ON p.classroom_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );
