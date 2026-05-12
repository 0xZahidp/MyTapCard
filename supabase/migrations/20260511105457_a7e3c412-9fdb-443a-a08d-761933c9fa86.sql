
-- link_cards: text/quote/highlight/ad blocks placed inside Links section
CREATE TABLE public.link_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid NULL,
  kind text NOT NULL DEFAULT 'note', -- note | quote | highlight | ad
  title text,
  content text NOT NULL DEFAULT '',
  author text,
  image_url text,
  cta_label text,
  cta_url text,
  bg_color text,
  text_color text,
  position integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.link_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages link cards"
ON public.link_cards FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Link cards viewable for public profiles"
ON public.link_cards FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = link_cards.user_id
    AND (p.public_enabled = true OR p.id = auth.uid())
));

CREATE TRIGGER trg_link_cards_updated_at
BEFORE UPDATE ON public.link_cards
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Extend pro_requests for subscription buy/extend/cancel flow
ALTER TABLE public.pro_requests
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'buy', -- buy | extend | cancel
  ADD COLUMN IF NOT EXISTS amount integer,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS payment_ref text;

-- Cancel pro request handler (admin)
CREATE OR REPLACE FUNCTION public.cancel_pro_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.pro_requests SET status='approved', reviewed_at=now(), reviewed_by=auth.uid()
    WHERE id = _request_id RETURNING user_id INTO _uid;
  UPDATE public.profiles SET is_pro = false, pro_until = NULL WHERE id = _uid;
END $$;

-- Allow user to extend their own pro_until via approved extend request handled by admin
CREATE OR REPLACE FUNCTION public.extend_pro_request(_request_id uuid, _days integer DEFAULT 365)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _uid uuid; current_pro timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.pro_requests SET status='approved', reviewed_at=now(), reviewed_by=auth.uid()
    WHERE id = _request_id RETURNING user_id INTO _uid;
  SELECT pro_until INTO current_pro FROM public.profiles WHERE id = _uid;
  UPDATE public.profiles
    SET is_pro = true,
        pro_until = GREATEST(COALESCE(current_pro, now()), now()) + (_days || ' days')::interval
    WHERE id = _uid;
END $$;
