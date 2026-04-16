-- ============================================
-- 007 : Système de classe virtuelle
-- ============================================

-- Table des classes
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_code varchar(6) NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Table des élèves de classe
CREATE TABLE IF NOT EXISTS classroom_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  login_code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_code ON classrooms(class_code);
CREATE INDEX IF NOT EXISTS idx_classroom_students_login ON classroom_students(login_code);
CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom ON classroom_students(classroom_id);

-- Ajouter le rôle 'teacher' et 'student' au profil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'teacher', 'student'));
-- Pour les élèves connectés via classe, on stocke la référence
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS classroom_id uuid REFERENCES classrooms(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS classroom_student_id uuid REFERENCES classroom_students(id);

-- RLS
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;

-- Le prof peut voir/gérer ses classes
CREATE POLICY "Teachers manage own classrooms" ON classrooms
  FOR ALL USING (teacher_id = auth.uid());

-- Le prof peut gérer les élèves de ses classes
CREATE POLICY "Teachers manage own students" ON classroom_students
  FOR ALL USING (
    classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
  );

-- Les élèves peuvent voir leur propre classe
CREATE POLICY "Students view own classroom" ON classrooms
  FOR SELECT USING (
    id IN (SELECT classroom_id FROM profiles WHERE id = auth.uid())
  );

-- Les élèves peuvent voir les élèves de leur classe
CREATE POLICY "Students view classmates" ON classroom_students
  FOR SELECT USING (
    classroom_id IN (SELECT classroom_id FROM profiles WHERE id = auth.uid())
  );
