import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Check, Clock, Sparkles, ShieldCheck, X, Repeat, Ban, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/subscription")({
  head: () => ({ meta: [{ title: "Subscription — MyTapCard" }] }),
  component: SubscriptionPage,
});

const PLAN_PRICE = 500;
const PLAN_CURRENCY = "BDT";
const PLAN_DAYS = 365;

interface Profile {
  is_pro: boolean;
  pro_until: string | null;
}
interface Req {
  id: string;
  status: string;
  kind: string;
  message: string | null;
  amount: number | null;
  currency: string | null;
  payment_ref: string | null;
  created_at: string;
  reviewed_at: string | null;
}
interface PaymentMethod {
  id: string;
  method: string;
  label: string;
  account: string;
  instructions: string | null;
}

const KIND_LABEL: Record<string, { label: string; icon: any; tone: string }> = {
  buy: { label: "Buy Pro", icon: Crown, tone: "default" },
  extend: { label: "Extend Pro", icon: Repeat, tone: "secondary" },
  cancel: { label: "Cancel Pro", icon: Ban, tone: "destructive" },
};

function SubscriptionPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState<"buy" | "extend" | "cancel" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [message, setMessage] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const paymentSectionRef = useRef<HTMLElement | null>(null);

  async function reload() {
    if (!user) return;
    const [{ data: p }, { data: r }, { data: pm }] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_pro, pro_until" as any)
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("pro_requests" as any)
        .select("id, status, kind, message, amount, currency, payment_ref, created_at, reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("pro_payment_methods" as any)
        .select("id, method, label, account, instructions")
        .eq("enabled", true)
        .order("position"),
    ]);
    setProfile((p as any) ?? { is_pro: false, pro_until: null });
    setRequests(((r as any[]) ?? []) as Req[]);
    const methods = ((pm as any[]) ?? []) as PaymentMethod[];
    setPaymentMethods(methods);
    setPaymentMethod((current) => current || methods[0]?.method || "");
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, [user]);

  const trial = profile?.pro_until ? new Date(profile.pro_until).getTime() > Date.now() : false;
  const isPro = !!profile?.is_pro || trial;
  const proUntil = profile?.pro_until ? new Date(profile.pro_until) : null;
  const pendingKinds = new Set(requests.filter((r) => r.status === "pending").map((r) => r.kind));
  const selectedPayment = paymentMethods.find((method) => method.method === paymentMethod);

  function openRequest(kind: "buy" | "extend" | "cancel") {
    setActiveKind(kind);
    if (kind !== "cancel") {
      setPaymentMethod(paymentMethods[0]?.method || "");
    }
    setMessage("");
    setPaymentRef("");

    window.setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function submit() {
    if (!user || !activeKind) return;
    if (pendingKinds.has(activeKind)) {
      toast.error("You already have a pending request of this kind");
      return;
    }
    if (activeKind !== "cancel" && !paymentRef.trim()) {
      toast.error("Please paste your payment transaction ID / reference");
      return;
    }
    if (activeKind !== "cancel" && !paymentMethod) {
      toast.error("Please choose a payment method");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("pro_requests" as any).insert({
      user_id: user.id,
      kind: activeKind,
      status: "pending",
      message:
        activeKind === "cancel"
          ? message.trim() || null
          : [
              `Payment method: ${selectedPayment?.label ?? paymentMethod}`,
              message.trim() ? `Note: ${message.trim()}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
      amount: activeKind === "cancel" ? null : PLAN_PRICE,
      currency: activeKind === "cancel" ? null : PLAN_CURRENCY,
      payment_ref: activeKind === "cancel" ? null : paymentRef.trim(),
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request sent — admin will review shortly");
    setActiveKind(null);
    setMessage("");
    setPaymentRef("");
    reload();
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your Pro plan — buy, extend or cancel anytime.
        </p>
      </header>

      {/* Status card */}
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              {isPro ? <Crown className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Current plan</div>
              <div className="text-2xl font-bold">
                {profile?.is_pro ? "Pro" : trial ? "Pro (Trial)" : "Free"}
              </div>
              {proUntil && (
                <div className="text-xs opacity-80">
                  {trial ? "Active" : "Ends"} until {proUntil.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/15 text-primary-foreground">
            {PLAN_PRICE} {PLAN_CURRENCY} / year
          </Badge>
        </div>
      </section>

      {/* Plan + actions */}
      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          icon={Crown}
          title="Buy Pro"
          desc="Unlock all Pro features for a full year."
          price={`${PLAN_PRICE} ${PLAN_CURRENCY}`}
          sub="365 days"
          variant="hero"
          disabled={isPro || pendingKinds.has("buy")}
          pending={pendingKinds.has("buy")}
          onClick={() => openRequest("buy")}
        />
        <ActionCard
          icon={Repeat}
          title="Extend Pro"
          desc="Add another year to your current plan."
          price={`+${PLAN_PRICE} ${PLAN_CURRENCY}`}
          sub="+365 days"
          variant="default"
          disabled={pendingKinds.has("extend")}
          pending={pendingKinds.has("extend")}
          onClick={() => openRequest("extend")}
        />
        <ActionCard
          icon={Ban}
          title="Cancel Pro"
          desc="Stop renewing and switch back to Free."
          price="Free"
          sub="No charge"
          variant="outline"
          disabled={!isPro || pendingKinds.has("cancel")}
          pending={pendingKinds.has("cancel")}
          onClick={() => openRequest("cancel")}
        />
      </section>

      {/* Form */}
      {activeKind && (
        <section
          id="subscription-payment"
          ref={paymentSectionRef}
          className="rounded-3xl border border-border bg-card p-6 shadow-soft animate-fade-in"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {activeKind === "cancel" ? (
                <Ban className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
              {KIND_LABEL[activeKind].label}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setActiveKind(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {activeKind !== "cancel" && (
            <div className="mb-4 rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
              <div className="font-semibold">How to pay</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>
                  Choose a payment method and send{" "}
                  <strong>
                    {PLAN_PRICE} {PLAN_CURRENCY}
                  </strong>
                  .
                </li>
                <li>Copy the transaction ID (TrxID) from the confirmation SMS.</li>
                <li>
                  Paste it below and submit — your Pro is activated once an admin approves it.
                </li>
              </ol>
              <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment method
                  </label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choose method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.method}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Copy number / address
                  </label>
                  <div className="flex overflow-hidden rounded-md border border-border bg-background">
                    <input
                      readOnly
                      value={selectedPayment?.account ?? ""}
                      placeholder="Choose a payment method"
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-none border-l border-border"
                      disabled={!selectedPayment?.account}
                      onClick={() => {
                        if (!selectedPayment?.account) return;
                        navigator.clipboard.writeText(selectedPayment.account);
                        toast.success(`${selectedPayment.label} copied`);
                      }}
                    >
                      <Copy className="h-4 w-4" /> Copy
                    </Button>
                  </div>
                  {selectedPayment?.instructions && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedPayment.instructions}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Transaction / Reference ID
                </label>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. 9HK4A2B7"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          {activeKind === "cancel" && (
            <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="font-semibold text-destructive">Cancel Pro</div>
              <p className="mt-1 text-muted-foreground">
                Your Pro features will be turned off after admin processes this request. You won't
                be charged again. You can buy Pro again anytime.
              </p>
            </div>
          )}

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Note (optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              activeKind === "cancel" ? "Reason for cancelling…" : "Anything we should know…"
            }
            rows={3}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setActiveKind(null)}>
              Back
            </Button>
            <Button
              variant={activeKind === "cancel" ? "destructive" : "hero"}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : `Submit ${KIND_LABEL[activeKind].label}`}
            </Button>
          </div>
        </section>
      )}

      {/* Request history */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">Request history</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscription requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const KindIcon = KIND_LABEL[r.kind]?.icon ?? Sparkles;
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <KindIcon className="h-4 w-4 text-muted-foreground" />
                      {KIND_LABEL[r.kind]?.label ?? r.kind}
                      {r.amount && (
                        <span className="text-xs text-muted-foreground">
                          · {r.amount} {r.currency}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                      {r.payment_ref && (
                        <>
                          {" "}
                          · TrxID: <span className="font-mono">{r.payment_ref}</span>
                        </>
                      )}
                    </div>
                    {r.message && (
                      <p className="mt-1 text-sm text-muted-foreground">"{r.message}"</p>
                    )}
                  </div>
                  {r.status === "pending" ? (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" /> Pending
                    </Badge>
                  ) : r.status === "approved" ? (
                    <Badge>
                      <Check className="mr-1 h-3 w-3" /> Approved
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <X className="mr-1 h-3 w-3" /> Rejected
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  price,
  sub,
  onClick,
  disabled,
  pending,
  variant,
}: {
  icon: any;
  title: string;
  desc: string;
  price: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
  variant: "hero" | "default" | "outline";
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-xl font-bold">{price}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <Button className="mt-4" variant={variant} onClick={onClick} disabled={disabled}>
        {pending ? "Pending review…" : disabled && !pending ? "Not available" : title}
      </Button>
    </div>
  );
}
