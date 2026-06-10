-- Migration: suppression des tables B2B (classroom, famille)
-- Ces features ont été retirées lors du recentrage sur le B2C solo.
-- À appliquer APRÈS s'être assuré qu'aucune donnée production n'est à conserver.

-- Classroom
DROP TABLE IF EXISTS classroom_settings   CASCADE;
DROP TABLE IF EXISTS classroom_teachers   CASCADE;
DROP TABLE IF EXISTS course_folders       CASCADE;
DROP TABLE IF EXISTS classroom_students   CASCADE;
DROP TABLE IF EXISTS classrooms           CASCADE;

-- Famille
DROP TABLE IF EXISTS child_stats          CASCADE;
DROP TABLE IF EXISTS child_accounts       CASCADE;
DROP TABLE IF EXISTS famille_groups       CASCADE;

-- Colonnes orphelines sur profiles
ALTER TABLE profiles
  DROP COLUMN IF EXISTS classroom_id,
  DROP COLUMN IF EXISTS classroom_student_id;
