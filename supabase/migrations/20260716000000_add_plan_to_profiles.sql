-- Add plan column to profiles
-- 'free'    → 15 stars, 10 letters, 1 theme (night)
-- 'premium' → unlimited stars, unlimited letters, all themes

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'premium'));

COMMENT ON COLUMN public.profiles.plan IS
  'Subscription tier: free (limited) or premium (unlimited). Connect to payment provider before upgrading.';
