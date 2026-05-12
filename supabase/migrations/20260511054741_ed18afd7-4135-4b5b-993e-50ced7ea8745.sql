ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS font_family text NOT NULL DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS custom_accent_from text,
  ADD COLUMN IF NOT EXISTS custom_accent_to text,
  ADD COLUMN IF NOT EXISTS avatar_shape text NOT NULL DEFAULT 'circle',
  ADD COLUMN IF NOT EXISTS card_radius text NOT NULL DEFAULT 'xl';