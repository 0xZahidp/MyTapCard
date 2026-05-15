-- Treat an active trial/referral window as effective Pro for profile-level rules.
CREATE OR REPLACE FUNCTION public.enforce_profile_pro_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  effective_pro boolean;
BEGIN
  effective_pro := COALESCE(NEW.is_pro, false)
    OR (NEW.pro_until IS NOT NULL AND NEW.pro_until > now());

  IF NEW.username IS NOT NULL AND char_length(NEW.username) < 5 AND effective_pro = false THEN
    RAISE EXCEPTION 'Usernames shorter than 5 characters are a Pro feature';
  END IF;

  IF NEW.branding_hidden = true AND effective_pro = false THEN
    RAISE EXCEPTION 'Hiding MyTapCard branding is a Pro feature';
  END IF;

  RETURN NEW;
END;
$$;

-- Expire both paid time-boxed Pro and trial/referral Pro windows.
CREATE OR REPLACE FUNCTION public.expire_pro_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  new_username text;
BEGIN
  FOR r IN
    SELECT id, username
    FROM public.profiles
    WHERE pro_until IS NOT NULL
      AND pro_until <= now()
  LOOP
    new_username := public.pad_username_unique(r.id, r.username);
    UPDATE public.profiles
      SET is_pro = false,
          pro_until = NULL,
          branding_hidden = false,
          username = new_username
      WHERE id = r.id;
  END LOOP;

  FOR r IN
    SELECT id, username
    FROM public.profiles
    WHERE is_pro = false
      AND pro_until IS NULL
      AND username IS NOT NULL
      AND char_length(username) < 5
  LOOP
    new_username := public.pad_username_unique(r.id, r.username);
    UPDATE public.profiles
      SET username = new_username,
          branding_hidden = false
      WHERE id = r.id;
  END LOOP;
END;
$$;
