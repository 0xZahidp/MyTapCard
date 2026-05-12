
REVOKE ALL ON FUNCTION public.expire_pro_users() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.pad_username_unique(uuid, text) FROM public, anon, authenticated;
