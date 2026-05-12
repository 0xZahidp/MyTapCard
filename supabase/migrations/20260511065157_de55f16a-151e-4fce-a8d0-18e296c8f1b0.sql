
-- Lock down admin-only RPCs
REVOKE EXECUTE ON FUNCTION public.approve_pro_request(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_pro_request(uuid)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_pro(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_pro_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_pro_request(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_pro(uuid, boolean) TO authenticated;

-- Lock down referral reward helper from anon (only triggered internally)
REVOKE EXECUTE ON FUNCTION public.handle_new_referral() FROM PUBLIC, anon;

-- Storage: tighten avatars bucket. Public reads still work via CDN
-- because the bucket itself is public, but listing/managing objects
-- must be scoped to the file owner.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN (
        'Avatar images are publicly accessible',
        'Public read for avatars',
        'Anyone can read avatars',
        'Public can read avatars'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Avatars: owner can list" ON storage.objects;
CREATE POLICY "Avatars: owner can list"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatars: owner can upload" ON storage.objects;
CREATE POLICY "Avatars: owner can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatars: owner can update" ON storage.objects;
CREATE POLICY "Avatars: owner can update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatars: owner can delete" ON storage.objects;
CREATE POLICY "Avatars: owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
