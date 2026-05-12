
-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Helper: pad a username with trailing zeros to >=5 chars, ensuring uniqueness
CREATE OR REPLACE FUNCTION public.pad_username_unique(_uid uuid, _username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
  exists_count int;
BEGIN
  IF _username IS NULL OR char_length(_username) >= 5 THEN
    RETURN _username;
  END IF;
  candidate := _username;
  WHILE char_length(candidate) < 5 LOOP
    candidate := candidate || '0';
  END LOOP;
  -- Ensure uniqueness; keep appending '0' if taken
  LOOP
    SELECT count(*) INTO exists_count FROM public.profiles
      WHERE username = candidate AND id <> _uid;
    EXIT WHEN exists_count = 0;
    candidate := candidate || '0';
  END LOOP;
  RETURN candidate;
END $$;

-- Main expiration routine
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
    WHERE is_pro = true
      AND pro_until IS NOT NULL
      AND pro_until <= now()
  LOOP
    new_username := public.pad_username_unique(r.id, r.username);
    UPDATE public.profiles
      SET is_pro = false,
          branding_hidden = false,
          username = new_username
      WHERE id = r.id;
  END LOOP;

  -- Also fix any non-pro user with short username (e.g. after admin cancel)
  FOR r IN
    SELECT id, username
    FROM public.profiles
    WHERE is_pro = false
      AND username IS NOT NULL
      AND char_length(username) < 5
  LOOP
    new_username := public.pad_username_unique(r.id, r.username);
    UPDATE public.profiles
      SET username = new_username,
          branding_hidden = false
      WHERE id = r.id;
  END LOOP;
END $$;

-- Update cancel_pro_request to safely strip pro features (pad username, unhide branding)
CREATE OR REPLACE FUNCTION public.cancel_pro_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid; _uname text; _new text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.pro_requests SET status='approved', reviewed_at=now(), reviewed_by=auth.uid()
    WHERE id = _request_id RETURNING user_id INTO _uid;
  SELECT username INTO _uname FROM public.profiles WHERE id = _uid;
  _new := public.pad_username_unique(_uid, _uname);
  UPDATE public.profiles
    SET is_pro = false,
        pro_until = NULL,
        branding_hidden = false,
        username = _new
    WHERE id = _uid;
END $$;

-- Update admin_set_pro to also clean up when turning off
CREATE OR REPLACE FUNCTION public.admin_set_pro(_user_id uuid, _is_pro boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uname text; _new text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _is_pro = false THEN
    SELECT username INTO _uname FROM public.profiles WHERE id = _user_id;
    _new := public.pad_username_unique(_user_id, _uname);
    UPDATE public.profiles
      SET is_pro = false,
          branding_hidden = false,
          username = _new
      WHERE id = _user_id;
  ELSE
    UPDATE public.profiles SET is_pro = true WHERE id = _user_id;
  END IF;
END $$;

-- Schedule hourly expiration
DO $$
BEGIN
  PERFORM cron.unschedule('expire-pro-users-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-pro-users-hourly',
  '0 * * * *',
  $$ SELECT public.expire_pro_users(); $$
);

-- Run once now to clean up existing expired users
SELECT public.expire_pro_users();
