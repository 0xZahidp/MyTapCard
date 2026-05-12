import { supabase } from "@/integrations/supabase/client";

const SESSION_RECHECK_ATTEMPTS = 8;
const SESSION_RECHECK_DELAY_MS = 150;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForVerifiedAuthSession() {
  for (let attempt = 0; attempt < SESSION_RECHECK_ATTEMPTS; attempt += 1) {
    const [{ data: userData, error: userError }, { data: sessionData, error: sessionError }] =
      await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

    if (userError) throw userError;
    if (sessionError) throw sessionError;

    if (userData.user && sessionData.session) {
      return sessionData.session;
    }

    await delay(SESSION_RECHECK_DELAY_MS * (attempt + 1));
  }

  throw new Error("We couldn't verify your login session. Please try again.");
}

export async function redirectWithFallback(navigate: () => Promise<unknown> | unknown, to: string) {
  await navigate();
  await delay(0);

  if (window.location.pathname !== to) {
    window.location.replace(to);
  }
}
