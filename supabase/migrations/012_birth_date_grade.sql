-- 012 : Date de naissance, niveau scolaire, email parent
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade_level text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email text;

-- Mettre a jour le trigger pour copier ces champs depuis les metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, birth_date, grade_level, parent_email)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'grade_level',
    new.raw_user_meta_data->>'parent_email'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, profiles.role),
    birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
    grade_level = COALESCE(EXCLUDED.grade_level, profiles.grade_level),
    parent_email = COALESCE(EXCLUDED.parent_email, profiles.parent_email);
  RETURN new;
END;
$$;