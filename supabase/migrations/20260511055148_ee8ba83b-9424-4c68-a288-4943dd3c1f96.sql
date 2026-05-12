ALTER TABLE public.link_groups
  ADD COLUMN IF NOT EXISTS font_family text,
  ADD COLUMN IF NOT EXISTS accent_from text,
  ADD COLUMN IF NOT EXISTS accent_to text;

ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS emoji text;