-- ============================================================
-- BOUTIQUE : historique des tours de roue
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wheel_spins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  segment_id text NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('lost', 'coins', 'boost_xp', 'frame', 'title')),
  reward_value integer NOT NULL DEFAULT 0,
  cost integer NOT NULL DEFAULT 50,
  net_gain integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own spins"
  ON public.wheel_spins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own spins"
  ON public.wheel_spins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- BOUTIQUE : inventaire utilisateur (cadres, titres, boosts…)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('frame', 'title', 'theme', 'avatar', 'boost_xp')),
  item_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  expires_at timestamptz,         -- pour les boosts temporaires
  equipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inventory"
  ON public.user_inventory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
