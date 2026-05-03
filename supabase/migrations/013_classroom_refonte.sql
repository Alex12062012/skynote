-- ============================================
-- 013 : Refonte du système de classe virtuelle
--   - Multi-profs (classroom_teachers)
--   - Dossiers matières (course_folders)
--   - Paramètres par classe (classroom_settings)
-- ============================================

-- ─── 1. TABLE MULTI-PROFS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classroom_teachers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id   uuid NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE (classroom_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_teachers_classroom ON classroom_teachers(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_teachers_teacher   ON classroom_teachers(teacher_id);

ALTER TABLE classroom_teachers ENABLE ROW LEVEL SECURITY;

-- Le créateur peut lire et gérer les membres
CREATE POLICY "Owner manages classroom_teachers" ON classroom_teachers
  FOR ALL USING (
    classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
  );

-- Un prof peut se lire lui-même
CREATE POLICY "Teacher reads own membership" ON classroom_teachers
  FOR SELECT USING (teacher_id = auth.uid());


-- ─── 2. TABLE DOSSIERS MATIÈRES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_folders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  name         text NOT NULL,
  color        text NOT NULL DEFAULT '#2563EB',
  is_default   boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_index  integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_folders_classroom ON course_folders(classroom_id);
CREATE INDEX IF NOT EXISTS idx_course_folders_order     ON course_folders(classroom_id, order_index);

ALTER TABLE course_folders ENABLE ROW LEVEL SECURITY;

-- Les profs de la classe peuvent tout gérer
CREATE POLICY "Teachers manage course_folders" ON course_folders
  FOR ALL USING (
    classroom_id IN (
      SELECT c.id FROM classrooms c
      WHERE c.teacher_id = auth.uid()
         OR EXISTS (
           SELECT 1 FROM classroom_teachers ct
           WHERE ct.classroom_id = c.id AND ct.teacher_id = auth.uid()
         )
    )
  );

-- Les élèves de la classe peuvent lire les dossiers
CREATE POLICY "Students read course_folders" ON course_folders
  FOR SELECT USING (
    classroom_id IN (
      SELECT classroom_id FROM profiles WHERE id = auth.uid()
    )
  );


-- ─── 3. TABLE PARAMÈTRES PAR CLASSE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classroom_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id         uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE UNIQUE,
  skycoins_enabled     boolean NOT NULL DEFAULT true,
  skycoins_in_ranking  boolean NOT NULL DEFAULT false,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE classroom_settings ENABLE ROW LEVEL SECURITY;

-- Seul le créateur peut modifier les paramètres
CREATE POLICY "Owner manages classroom_settings" ON classroom_settings
  FOR ALL USING (
    classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
  );

-- Les membres (co-profs) peuvent lire les paramètres
CREATE POLICY "Teachers read classroom_settings" ON classroom_settings
  FOR SELECT USING (
    classroom_id IN (
      SELECT classroom_id FROM classroom_teachers WHERE teacher_id = auth.uid()
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_classroom_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER classroom_settings_updated_at
  BEFORE UPDATE ON classroom_settings
  FOR EACH ROW EXECUTE FUNCTION update_classroom_settings_updated_at();


-- ─── 4. INITIALISATION DES SETTINGS POUR LES CLASSES EXISTANTES ──────────────

INSERT INTO classroom_settings (classroom_id)
SELECT id FROM classrooms
WHERE id NOT IN (SELECT classroom_id FROM classroom_settings)
ON CONFLICT DO NOTHING;
