import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Wallet, Crown } from "lucide-react";
import { ReorderButtons } from "@/components/ui/reorder-buttons";
import { moveItem } from "@/lib/reorder";

export const Route = createFileRoute("/_authenticated/financial")({
  head: () => ({ meta: [{ title: "Financial — MyTapCard" }] }),
  component: FinancialPage,
});

interface Method {
  id: string;
  type: string;
  label: string;
  value: string;
  note: string | null;
  position: number;
  hidden: boolean;
  bank_name: string | null;
  account_holder: string | null;
  branch_name: string | null;
  routing_number: string | null;
  swift_code: string | null;
  copyable: boolean;
}

const TYPES = [
  { value: "bkash", label: "bKash (BD)" },
  { value: "nagad", label: "Nagad (BD)" },
  { value: "rocket", label: "Rocket (BD)" },
  { value: "upay", label: "Upay (BD)" },
  { value: "iban", label: "Bank / IBAN" },
  { value: "btc", label: "Bitcoin" },
  { value: "eth", label: "Ethereum" },
  { value: "usdt", label: "USDT" },
  { value: "custom", label: "Custom (Pro)" },
];

function FinancialPage() {
  const { user } = useAuth();
  const { isPro, loading: proLoading } = useProStatus();
  const [profile, setProfile] = useState<any>(null);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!user) return;
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase
        .from("profiles")
        .select("financial_enabled, financial_title")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("financial_methods").select("*").eq("user_id", user.id).order("position"),
    ]);
    setProfile(p);
    setMethods((m ?? []) as Method[]);
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, [user]);

  async function updateProfile(patch: any) {
    if (!user) return;
    setProfile({ ...profile, ...patch });
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) toast.error(error.message);
  }

  async function addMethod() {
    if (!user) return;
    const { error } = await supabase.from("financial_methods").insert({
      user_id: user.id,
      type: "bkash",
      label: "",
      value: "",
      position: methods.length,
    });
    if (error) toast.error(error.message);
    else reload();
  }
  async function updateMethod(id: string, patch: Partial<Method>) {
    setMethods((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const { error } = await supabase.from("financial_methods").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }
  async function deleteMethod(id: string) {
    await supabase.from("financial_methods").delete().eq("id", id);
    reload();
  }

  if (loading || proLoading) return <div className="text-muted-foreground">Loading…</div>;

  if (!isPro) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
        <Crown className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Financial is a Pro feature</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Upgrade to Pro to accept payments via bKash, Nagad, IBAN, crypto, and your own custom
          payment methods.
        </p>
        <Button asChild variant="hero" className="mt-5">
          <Link to="/settings">Request Pro</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Financial</h1>
          <p className="mt-1 text-muted-foreground">
            Add optional payment details visitors can use to pay you.
          </p>
        </div>
        <Button variant="hero" onClick={addMethod}>
          <Plus className="h-4 w-4" /> Add method
        </Button>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Show Financial tab on public profile</div>
            <div className="text-sm text-muted-foreground">
              Visitors will see a Financial tab on your card.
            </div>
          </div>
          <Switch
            checked={!!profile?.financial_enabled}
            onCheckedChange={(v) => updateProfile({ financial_enabled: v })}
          />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="title">Section title</Label>
          <Input
            id="title"
            value={profile?.financial_title ?? ""}
            onChange={(e) => setProfile({ ...profile, financial_title: e.target.value })}
            onBlur={(e) => updateProfile({ financial_title: e.target.value })}
            placeholder="Send a payment"
          />
        </div>
      </section>

      {methods.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
          <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">No payment methods yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add PayPal, Venmo, IBAN, crypto wallets, and more.
          </p>
          <Button variant="hero" className="mt-4" onClick={addMethod}>
            <Plus className="h-4 w-4" /> Add method
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m, i) => (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start gap-2">
                <ReorderButtons
                  index={i}
                  total={methods.length}
                  vertical
                  onMove={async (delta) => {
                    const next = await moveItem(methods, i, delta, "financial_methods");
                    if (next) setMethods(next);
                  }}
                />
                <div className="flex-1 grid gap-2 sm:grid-cols-[160px_1fr]">
                  <Select value={m.type} onValueChange={(v) => updateMethod(m.id, { type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Label (optional)"
                    value={m.label}
                    onChange={(e) => updateMethod(m.id, { label: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 px-1" title="Visible on public profile">
                  <Switch
                    checked={!m.hidden}
                    onCheckedChange={(v) => updateMethod(m.id, { hidden: !v })}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMethod(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {m.type === "iban" ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Bank Name</Label>
                    <Input
                      placeholder="e.g. Dutch-Bangla Bank"
                      value={m.bank_name ?? ""}
                      onChange={(e) => updateMethod(m.id, { bank_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">A/C Holder Name</Label>
                    <Input
                      placeholder="Full name on account"
                      value={m.account_holder ?? ""}
                      onChange={(e) => updateMethod(m.id, { account_holder: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">A/C Number</Label>
                    <Input
                      placeholder="Account / IBAN number"
                      value={m.value}
                      onChange={(e) => updateMethod(m.id, { value: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">
                      Branch Name <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      placeholder="Branch"
                      value={m.branch_name ?? ""}
                      onChange={(e) => updateMethod(m.id, { branch_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">
                      Routing Number <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      placeholder="Routing"
                      value={m.routing_number ?? ""}
                      onChange={(e) => updateMethod(m.id, { routing_number: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">
                      SWIFT Code <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      placeholder="SWIFT / BIC"
                      value={m.swift_code ?? ""}
                      onChange={(e) => updateMethod(m.id, { swift_code: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      rows={2}
                      placeholder="Note (optional)"
                      value={m.note ?? ""}
                      onChange={(e) => updateMethod(m.id, { note: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">Allow visitors to copy fields</div>
                      <div className="text-xs text-muted-foreground">
                        Shows a copy button next to each field on your public card.
                      </div>
                    </div>
                    <Switch
                      checked={m.copyable}
                      onCheckedChange={(v) => updateMethod(m.id, { copyable: v })}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  <Input
                    placeholder={placeholderFor(m.type)}
                    value={m.value}
                    onChange={(e) => updateMethod(m.id, { value: e.target.value })}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Note (optional, e.g. preferred memo)"
                    value={m.note ?? ""}
                    onChange={(e) => updateMethod(m.id, { note: e.target.value })}
                  />
                  <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
                    <div className="text-sm font-medium">Allow visitors to copy</div>
                    <Switch
                      checked={m.copyable}
                      onCheckedChange={(v) => updateMethod(m.id, { copyable: v })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function placeholderFor(type: string) {
  switch (type) {
    case "bkash":
    case "nagad":
    case "rocket":
    case "upay":
      return "01XXXXXXXXX (mobile number)";
    case "iban":
      return "IBAN or account number";
    case "btc":
    case "eth":
    case "usdt":
      return "Wallet address";
    case "custom":
      return "Anything — link, address, instructions…";
    default:
      return "Details";
  }
}
