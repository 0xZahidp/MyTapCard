
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.enforce_profile_pro_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NOT NULL AND char_length(NEW.username) < 5 AND NEW.is_pro = false THEN
    RAISE EXCEPTION 'Usernames shorter than 5 characters are a Pro feature';
  END IF;
  IF NEW.branding_hidden = true AND NEW.is_pro = false THEN
    RAISE EXCEPTION 'Hiding MyTapCard branding is a Pro feature';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_pro_rules_trg ON public.profiles;
CREATE TRIGGER enforce_profile_pro_rules_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_pro_rules();
