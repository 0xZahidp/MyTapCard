CREATE TABLE IF NOT EXISTS public.pro_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL UNIQUE,
  label text NOT NULL,
  account text NOT NULL DEFAULT 'xxxxxxx',
  instructions text,
  enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pro_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view enabled pro payment methods" ON public.pro_payment_methods;
CREATE POLICY "Authenticated users view enabled pro payment methods"
ON public.pro_payment_methods FOR SELECT
USING (enabled = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage pro payment methods" ON public.pro_payment_methods;
CREATE POLICY "Admins manage pro payment methods"
ON public.pro_payment_methods FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS touch_pro_payment_methods_updated_at ON public.pro_payment_methods;
CREATE TRIGGER touch_pro_payment_methods_updated_at
BEFORE UPDATE ON public.pro_payment_methods
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.pro_payment_methods (method, label, account, instructions, position)
VALUES
  ('bkash', 'bKash Personal', 'xxxxxxx', 'Send Money to this bKash personal number.', 0),
  ('nagad', 'Nagad Personal', 'xxxxxxx', 'Send Money to this Nagad personal number.', 1),
  ('rocket', 'Rocket Personal', 'xxxxxxx', 'Send Money to this Rocket personal number.', 2),
  ('binance', 'Binance', 'xxxxxxx', 'Send to this Binance Pay ID or wallet reference.', 3)
ON CONFLICT (method) DO UPDATE
SET label = EXCLUDED.label,
    position = EXCLUDED.position;
