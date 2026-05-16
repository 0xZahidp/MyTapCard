ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_badge_enabled boolean NOT NULL DEFAULT true;
