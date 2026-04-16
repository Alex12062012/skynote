CREATE OR REPLACE FUNCTION increment_coins(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET sky_coins = GREATEST(0, sky_coins + p_amount)
  WHERE id = p_user_id;
END;
$$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'plus', 'famille'));

UPDATE public.profiles SET plan = 'plus' WHERE plan = 'premium';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'qcm_status'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN qcm_status text NOT NULL DEFAULT 'pending'
      CHECK (qcm_status IN ('pending', 'processing', 'ready', 'error'));
  END IF;
END $$;