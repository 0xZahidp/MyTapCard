import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Crown,
  Check,
  X,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Gift,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — MyTapCard" }] }),
  // Skip auth/role checks during SSR/prerender — handled in component below.
  component: AdminPage,
});

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "deny">("loading");
  const [info, setInfo] = useState<{
    userId: string | null;
    email: string | null;
    roles: string[];
    error: string | null;
  }>({ userId: null, email: null, roles: [], error: null });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (!cancelled) setState("deny");
        return;
      }
      const { data: roles, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", u.user.id);
      if (cancelled) return;
      const roleList = ((roles as any[]) ?? []).map((r) => r.role as string);
      setInfo({
        userId: u.user.id,
        email: u.user.email ?? null,
        roles: roleList,
        error: error?.message ?? null,
      });
      setState(roleList.includes("admin") ? "ok" : "deny");
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (state === "loading")
    return <div className="p-8 text-muted-foreground">Checking admin access…</div>;
  if (state === "deny")
    return (
      <div className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h1 className="text-xl font-bold">Access denied</h1>
        <p className="text-sm text-muted-foreground">Your account doesn't have admin privileges.</p>
        <div className="rounded-xl bg-secondary/40 p-3 text-xs font-mono space-y-1">
          <div>
            <span className="text-muted-foreground">user_id:</span>{" "}
            {info.userId ?? "(not signed in)"}
          </div>
          <div>
            <span className="text-muted-foreground">email:</span> {info.email ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">roles:</span>{" "}
            {info.roles.length ? info.roles.join(", ") : "(none)"}
          </div>
          <div>
            <span className="text-muted-foreground">is_admin:</span>{" "}
            {info.roles.includes("admin") ? "true" : "false"}
          </div>
          {info.error && <div className="text-destructive">error: {info.error}</div>}
        </div>
      </div>
    );
  return <>{children}</>;
}

interface UserRow {
  id: string;
  display_name: string | null;
  username: string | null;
  is_pro: boolean;
  pro_until: string | null;
  created_at: string;
  referral_code: string | null;
  referred_by: string | null;
}
interface ReqRow {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  kind: string;
  amount: number | null;
  currency: string | null;
  payment_ref: string | null;
  created_at: string;
  reviewed_at: string | null;
}
interface ProPaymentMethod {
  id: string;
  method: string;
  label: string;
  account: string;
  instructions: string | null;
  enabled: boolean;
  position: number;
}

const PAGE_SIZE = 15;
const PRO_DURATION_PRESETS = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
] as const;

function AdminPage() {
  return (
    <AdminGuard>
      <AdminPageInner />
    </AdminGuard>
  );
}

function AdminPageInner() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<ProPaymentMethod[]>([]);
  const [referralCounts, setReferralCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [grantDays, setGrantDays] = useState<Record<string, string>>({});

  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());

  async function reload() {
    const [{ data: us }, { data: rs }, { data: refs }, { data: rolesData }, { data: payments }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, display_name, username, is_pro, pro_until, created_at, referral_code, referred_by" as any,
          )
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("pro_requests" as any)
          .select(
            "id, user_id, status, message, kind, amount, currency, payment_ref, created_at, reviewed_at",
          )
          .order("created_at", { ascending: false }),
        supabase.from("referrals" as any).select("referrer_id"),
        supabase
          .from("user_roles" as any)
          .select("user_id, role")
          .eq("role", "admin"),
        supabase
          .from("pro_payment_methods" as any)
          .select("id, method, label, account, instructions, enabled, position")
          .order("position"),
      ]);
    setUsers(((us as any[]) ?? []) as UserRow[]);
    setRequests(((rs as any[]) ?? []) as ReqRow[]);
    setPaymentMethods(((payments as any[]) ?? []) as ProPaymentMethod[]);
    const counts: Record<string, number> = {};
    for (const r of (refs as any[]) ?? []) counts[r.referrer_id] = (counts[r.referrer_id] ?? 0) + 1;
    setReferralCounts(counts);
    setAdminIds(new Set(((rolesData as any[]) ?? []).map((r) => r.user_id)));
    setLoading(false);
  }

  async function approve(r: ReqRow) {
    let rpc: string = "approve_pro_request";
    let params: any = { _request_id: r.id };
    if (r.kind === "extend") {
      rpc = "extend_pro_request";
      params = { _request_id: r.id, _days: 365 };
    } else if (r.kind === "cancel") {
      rpc = "cancel_pro_request";
    }
    const { error } = await supabase.rpc(rpc as any, params as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Approved");
      reload();
    }
  }
  async function reject(id: string) {
    const { error } = await supabase.rpc("reject_pro_request" as any, { _request_id: id } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Rejected");
      reload();
    }
  }
  async function grantPro(uid: string) {
    const days = Number(grantDays[uid] ?? 365);
    const { error } = await supabase.rpc(
      "admin_grant_pro" as any,
      { _user_id: uid, _days: days } as any,
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      `Pro granted for ${PRO_DURATION_PRESETS.find((p) => p.days === days)?.label ?? `${days} days`}`,
    );
    reload();
  }
  async function revokePro(uid: string) {
    const { error } = await supabase.rpc(
      "admin_set_pro" as any,
      { _user_id: uid, _is_pro: false } as any,
    );
    if (error) toast.error(error.message);
    else {
      toast.success("Pro revoked");
      reload();
    }
  }
  async function setAdmin(uid: string, val: boolean) {
    if (val) {
      const { error } = await supabase
        .from("user_roles" as any)
        .insert({ user_id: uid, role: "admin" } as any);
      if (error) return toast.error(error.message);
      toast.success("Granted admin");
    } else {
      const { error } = await supabase
        .from("user_roles" as any)
        .delete()
        .eq("user_id", uid)
        .eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Revoked admin");
    }
    reload();
  }
  async function updatePaymentMethod(id: string, patch: Partial<ProPaymentMethod>) {
    setPaymentMethods((methods) =>
      methods.map((method) => (method.id === id ? { ...method, ...patch } : method)),
    );
    const { error } = await supabase
      .from("pro_payment_methods" as any)
      .update(patch as any)
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      reload();
      return;
    }
    toast.success("Payment method updated");
  }
  useEffect(() => {
    reload();
  }, []);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filtered = useMemo(() => {
    if (!q) return users;
    const s = q.toLowerCase();
    return users.filter(
      (u) =>
        (u.display_name ?? "").toLowerCase().includes(s) ||
        (u.username ?? "").toLowerCase().includes(s) ||
        u.id.toLowerCase().includes(s) ||
        (u.referral_code ?? "").toLowerCase().includes(s),
    );
  }, [q, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => {
    setPage(1);
  }, [q]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending").slice(0, 10);

  function renderRequestRow(r: ReqRow) {
    const u = userMap.get(r.user_id);
    const trial = u?.pro_until && new Date(u.pro_until).getTime() > Date.now();
    const refCount = referralCounts[r.user_id] ?? 0;
    return (
      <div key={r.id} className="rounded-2xl border border-border p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium">
              {u?.display_name ?? u?.username ?? r.user_id.slice(0, 8)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <Badge
                variant={
                  r.kind === "cancel"
                    ? "destructive"
                    : r.kind === "extend"
                      ? "secondary"
                      : "default"
                }
                className="uppercase"
              >
                {r.kind}
              </Badge>
              {r.amount && (
                <span className="text-muted-foreground">
                  {r.amount} {r.currency}
                </span>
              )}
              {r.payment_ref && (
                <span className="text-muted-foreground">
                  · TrxID: <span className="font-mono">{r.payment_ref}</span>
                </span>
              )}
              <Badge variant={u?.is_pro ? "default" : trial ? "secondary" : "outline"}>
                {u?.is_pro ? (
                  <>
                    <Crown className="mr-1 h-3 w-3" /> PRO
                  </>
                ) : trial ? (
                  <>
                    <Clock className="mr-1 h-3 w-3" /> TRIAL
                  </>
                ) : (
                  "FREE"
                )}
              </Badge>
              {trial && (
                <span className="text-muted-foreground">
                  until {new Date(u!.pro_until!).toLocaleDateString()}
                </span>
              )}
              <span className="text-muted-foreground">
                · <Gift className="inline h-3 w-3" /> {refCount} referrals
              </span>
              <span className="text-muted-foreground">
                · {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            {r.message && <p className="mt-2 text-sm text-muted-foreground">"{r.message}"</p>}
          </div>
          {r.status === "pending" ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={r.kind === "cancel" ? "destructive" : "hero"}
                onClick={() => approve(r)}
              >
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          ) : (
            <Badge variant={r.status === "approved" ? "default" : "destructive"}>{r.status}</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">Manage Pro requests and user accounts.</p>
        </div>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Pro payment methods</h2>
          <p className="text-sm text-muted-foreground">
            These numbers or addresses are shown to users when they request Pro.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <div key={method.id} className="rounded-2xl border border-border bg-secondary/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{method.label}</div>
                  <div className="text-xs uppercase text-muted-foreground">{method.method}</div>
                </div>
                <Switch
                  checked={method.enabled}
                  onCheckedChange={(enabled) => updatePaymentMethod(method.id, { enabled })}
                />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Display label
                  </label>
                  <Input
                    value={method.label}
                    onChange={(e) =>
                      setPaymentMethods((methods) =>
                        methods.map((item) =>
                          item.id === method.id ? { ...item, label: e.target.value } : item,
                        ),
                      )
                    }
                    onBlur={(e) => updatePaymentMethod(method.id, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Number / address
                  </label>
                  <Input
                    value={method.account}
                    onChange={(e) =>
                      setPaymentMethods((methods) =>
                        methods.map((item) =>
                          item.id === method.id ? { ...item, account: e.target.value } : item,
                        ),
                      )
                    }
                    onBlur={(e) => updatePaymentMethod(method.id, { account: e.target.value })}
                    className="font-mono"
                    placeholder="xxxxxxx"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Instructions
                  </label>
                  <Input
                    value={method.instructions ?? ""}
                    onChange={(e) =>
                      setPaymentMethods((methods) =>
                        methods.map((item) =>
                          item.id === method.id
                            ? { ...item, instructions: e.target.value || null }
                            : item,
                        ),
                      )
                    }
                    onBlur={(e) =>
                      updatePaymentMethod(method.id, { instructions: e.target.value || null })
                    }
                    placeholder="Optional helper text"
                  />
                </div>
              </div>
            </div>
          ))}
          {paymentMethods.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No payment methods found. Run the latest Supabase migration to seed bKash, Nagad,
              Rocket, and Binance.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pending Pro requests</h2>
          <Badge variant="secondary">{pending.length}</Badge>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="space-y-3">{pending.map(renderRequestRow)}</div>
        )}
        {reviewed.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Recently reviewed ({reviewed.length})
            </summary>
            <div className="mt-3 space-y-3">{reviewed.map(renderRequestRow)}</div>
          </details>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Users ({filtered.length})</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search name, username, code, id…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Referrals</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-right">Pro access</TableHead>
                <TableHead className="text-right">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((u) => {
                const trial = u.pro_until && new Date(u.pro_until).getTime() > Date.now();
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">@{u.username ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_pro ? "default" : trial ? "secondary" : "outline"}>
                        {u.is_pro ? "PRO" : trial ? "TRIAL" : "FREE"}
                      </Badge>
                      {trial && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          ends {new Date(u.pro_until!).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {referralCounts[u.id] ?? 0}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[230px] flex-wrap items-center justify-end gap-2">
                        <Select
                          value={grantDays[u.id] ?? "365"}
                          onValueChange={(value) =>
                            setGrantDays((prev) => ({ ...prev, [u.id]: value }))
                          }
                        >
                          <SelectTrigger className="h-9 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRO_DURATION_PRESETS.map((preset) => (
                              <SelectItem key={preset.days} value={String(preset.days)}>
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="hero" onClick={() => grantPro(u.id)}>
                          {u.is_pro || trial ? "Extend" : "Grant"}
                        </Button>
                        {(u.is_pro || trial) && (
                          <Button size="sm" variant="outline" onClick={() => revokePro(u.id)}>
                            Revoke
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {adminIds.has(u.id) && (
                          <Badge variant="secondary">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        <Switch
                          checked={adminIds.has(u.id)}
                          onCheckedChange={(v) => setAdmin(u.id, v)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No users match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
