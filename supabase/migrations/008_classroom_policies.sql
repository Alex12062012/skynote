-- 008 : Policies supplémentaires pour le système classroom
-- Permettre aux utilisateurs de lire les cours des profs de leur classe
CREATE POLICY "Students read teacher courses" ON courses
  FOR SELECT USING (
    user_id IN (
      SELECT teacher_id FROM classrooms 
      WHERE id IN (SELECT classroom_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Permettre aux utilisateurs de lire les flashcards des cours de leur prof
CREATE POLICY "Students read teacher flashcards" ON flashcards
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE user_id IN (
        SELECT teacher_id FROM classrooms 
        WHERE id IN (SELECT classroom_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- Permettre aux utilisateurs de lire les QCM des cours de leur prof
CREATE POLICY "Students read teacher qcm" ON qcm_questions
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses WHERE user_id IN (
        SELECT teacher_id FROM classrooms 
        WHERE id IN (SELECT classroom_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- Permettre à un user de mettre à jour son propre profil (pour le classroom_id)
-- (si pas déjà existante)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users update own profile'
  ) THEN
    CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
  END IF;
END $$;
