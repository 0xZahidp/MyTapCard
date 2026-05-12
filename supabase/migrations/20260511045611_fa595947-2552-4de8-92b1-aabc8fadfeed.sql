
ALTER TABLE public.profiles
ADD COLUMN financial_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN financial_title text NOT NULL DEFAULT 'Send a payment';

CREATE TABLE public.financial_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'paypal',
  label text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  note text,
  position integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages financial methods"
ON public.financial_methods FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Financial methods viewable for public profiles when enabled"
ON public.financial_methods FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = financial_methods.user_id
    AND ((p.public_enabled = true AND p.financial_enabled = true) OR p.id = auth.uid())
));

CREATE TRIGGER touch_financial_methods_updated_at
BEFORE UPDATE ON public.financial_methods
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
