import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/preview")({
  head: () => ({ meta: [{ title: "Preview — MyTapCard" }] }),
  component: PreviewPage,
});

function PreviewPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [user]);

  if (!username)
    return <div className="text-muted-foreground">Set a username on your profile to preview.</div>;
  const url = `/${username}`;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Preview</h1>
          <p className="mt-1 text-muted-foreground">This is exactly what visitors will see.</p>
        </div>
        <Button asChild variant="hero">
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Open in new tab
          </a>
        </Button>
      </header>
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
        <iframe title="Profile preview" src={url} className="h-[80vh] w-full" />
      </div>
    </div>
  );
}
