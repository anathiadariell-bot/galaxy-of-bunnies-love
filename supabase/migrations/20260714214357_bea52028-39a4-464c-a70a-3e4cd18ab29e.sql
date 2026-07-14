
-- stars
CREATE TABLE public.stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  note text,
  color text NOT NULL DEFAULT 'gold',
  emotion text NOT NULL DEFAULT 'love',
  starred_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stars TO authenticated;
GRANT ALL ON public.stars TO service_role;
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own stars" ON public.stars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stars" ON public.stars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stars" ON public.stars FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stars" ON public.stars FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER stars_set_updated_at BEFORE UPDATE ON public.stars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX stars_user_created_idx ON public.stars(user_id, created_at DESC);

-- letters
CREATE TABLE public.letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  unlock_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.letters TO authenticated;
GRANT ALL ON public.letters TO service_role;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own letters" ON public.letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own letters" ON public.letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own letters" ON public.letters FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own letters" ON public.letters FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER letters_set_updated_at BEFORE UPDATE ON public.letters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX letters_user_created_idx ON public.letters(user_id, created_at DESC);

-- profiles: theme
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'night';
