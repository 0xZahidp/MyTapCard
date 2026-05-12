-- Track link clicks (public can insert, owner can read aggregates)
CREATE TABLE public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  link_id uuid,
  link_type text NOT NULL DEFAULT 'url',
  platform text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_link_clicks_user_id ON public.link_clicks(user_id, clicked_at DESC);
CREATE INDEX idx_link_clicks_link_id ON public.link_clicks(link_id);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone visiting a public profile can record a click event
CREATE POLICY "Anyone can record a click for a public profile"
ON public.link_clicks FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = link_clicks.user_id AND p.public_enabled = true
  )
);

-- Profile owner can view their own analytics
CREATE POLICY "Owner can view own clicks"
ON public.link_clicks FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Add share visibility ('both' | 'links' | 'financial')
ALTER TABLE public.profiles
  ADD COLUMN share_visibility text NOT NULL DEFAULT 'both';
