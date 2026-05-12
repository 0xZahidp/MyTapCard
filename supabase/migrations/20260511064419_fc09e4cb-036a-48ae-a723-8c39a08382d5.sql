
-- Roles enum and table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profile additions for trial + referrals
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_until timestamptz,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Effective pro check
CREATE OR REPLACE FUNCTION public.is_user_pro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT is_pro OR (pro_until IS NOT NULL AND pro_until > now())
       FROM public.profiles WHERE id = _user_id),
    false)
$$;

-- Pro requests
CREATE TABLE IF NOT EXISTS public.pro_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
ALTER TABLE public.pro_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own pro requests" ON public.pro_requests;
CREATE POLICY "Users view own pro requests" ON public.pro_requests FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users create own pro requests" ON public.pro_requests;
CREATE POLICY "Users create own pro requests" ON public.pro_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage pro requests" ON public.pro_requests;
CREATE POLICY "Admins manage pro requests" ON public.pro_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Referrals tracking
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  rewarded boolean NOT NULL DEFAULT false
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own referrals" ON public.referrals;
CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.has_role(auth.uid(), 'admin'));

-- Approve Pro request: set profile is_pro and clear trial cap
CREATE OR REPLACE FUNCTION public.approve_pro_request(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.pro_requests SET status='approved', reviewed_at=now(), reviewed_by=auth.uid()
    WHERE id = _request_id RETURNING user_id INTO _uid;
  UPDATE public.profiles SET is_pro = true WHERE id = _uid;
END $$;

CREATE OR REPLACE FUNCTION public.reject_pro_request(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.pro_requests SET status='rejected', reviewed_at=now(), reviewed_by=auth.uid()
    WHERE id = _request_id;
END $$;

-- Admin sets/unsets pro on a user
CREATE OR REPLACE FUNCTION public.admin_set_pro(_user_id uuid, _is_pro boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.profiles SET is_pro = _is_pro WHERE id = _user_id;
END $$;

-- Referral reward trigger: 3 days per referral, max 10 rewards in last 30 days
CREATE OR REPLACE FUNCTION public.handle_new_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent_count int; current_pro timestamptz;
BEGIN
  SELECT count(*) INTO recent_count FROM public.referrals
    WHERE referrer_id = NEW.referrer_id
      AND rewarded = true
      AND created_at > now() - interval '30 days';
  IF recent_count >= 10 THEN
    RETURN NEW; -- cap reached, no reward
  END IF;
  SELECT pro_until INTO current_pro FROM public.profiles WHERE id = NEW.referrer_id;
  UPDATE public.profiles
    SET pro_until = GREATEST(COALESCE(current_pro, now()), now()) + interval '3 days'
    WHERE id = NEW.referrer_id;
  NEW.rewarded := true;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_referral_reward ON public.referrals;
CREATE TRIGGER trg_referral_reward
  BEFORE INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_referral();

-- Updated new-user handler: trial + referral code + referred_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ref_code text;
  _referrer_id uuid;
  _new_code text;
BEGIN
  _new_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  _ref_code := NEW.raw_user_meta_data->>'ref';

  IF _ref_code IS NOT NULL THEN
    SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = _ref_code;
  END IF;

  INSERT INTO public.profiles (id, display_name, avatar_url, pro_until, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    now() + interval '14 days',
    _new_code,
    _referrer_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  IF _referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id) VALUES (_referrer_id, NEW.id)
      ON CONFLICT (referred_id) DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill referral codes for existing profiles
UPDATE public.profiles SET referral_code = lower(substr(replace(gen_random_uuid()::text,'-',''),1,8))
  WHERE referral_code IS NULL;

-- Backfill default user role
INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'user' FROM public.profiles
  ON CONFLICT DO NOTHING;
