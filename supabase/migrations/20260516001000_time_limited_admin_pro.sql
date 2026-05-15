-- Admin Pro grants must be time-limited. No more lifetime Pro from toggles.
CREATE OR REPLACE FUNCTION public.admin_grant_pro(_user_id uuid, _days integer DEFAULT 365)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_pro timestamptz;
  safe_days integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  safe_days := LEAST(GREATEST(COALESCE(_days, 365), 1), 3660);
  SELECT pro_until INTO current_pro FROM public.profiles WHERE id = _user_id;

  UPDATE public.profiles
    SET is_pro = true,
        pro_until = GREATEST(COALESCE(current_pro, now()), now()) + (safe_days || ' days')::interval
    WHERE id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_pro_request(_request_id uuid, _days integer DEFAULT 365)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.pro_requests
    SET status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = _request_id
    RETURNING user_id INTO _uid;

  PERFORM public.admin_grant_pro(_uid, _days);
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_pro_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.approve_pro_request(_request_id, 365);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_pro(_user_id uuid, _is_pro boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uname text;
  _new text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _is_pro = true THEN
    RAISE EXCEPTION 'Use admin_grant_pro with a time limit to grant Pro';
  END IF;

  SELECT username INTO _uname FROM public.profiles WHERE id = _user_id;
  _new := public.pad_username_unique(_user_id, _uname);

  UPDATE public.profiles
    SET is_pro = false,
        pro_until = NULL,
        branding_hidden = false,
        username = _new
    WHERE id = _user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_grant_pro(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_pro(uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_pro_request(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_pro_request(uuid, integer) TO authenticated;
