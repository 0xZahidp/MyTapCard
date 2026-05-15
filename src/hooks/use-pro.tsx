import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useProStatus() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [proUntil, setProUntil] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPro(false);
      setIsTrial(false);
      setProUntil(null);
      setIsAdmin(false);
      setReferralCode(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_pro, pro_until, referral_code" as any)
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_roles" as any)
          .select("role")
          .eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const prof = p as any;
      const trial = prof?.pro_until ? new Date(prof.pro_until).getTime() > Date.now() : false;
      setIsPro(!!prof?.is_pro || trial);
      setIsTrial(!prof?.is_pro && trial);
      setProUntil(prof?.pro_until ?? null);
      setReferralCode(prof?.referral_code ?? null);
      setIsAdmin(!!(roles as any[])?.some((r) => r.role === "admin"));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isPro, isTrial, proUntil, isAdmin, referralCode, loading };
}
