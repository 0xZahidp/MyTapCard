ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cta_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cta_label text NOT NULL DEFAULT 'Let''s Work Together',
  ADD COLUMN IF NOT EXISTS cta_url text;