import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReorderButtons } from "@/components/ui/reorder-buttons";
import { Trash2, MessageSquareQuote, Megaphone, StickyNote, Sparkles } from "lucide-react";

export interface CardRow {
  id: string;
  group_id: string | null;
  kind: string;
  title: string | null;
  content: string;
  author: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  bg_color: string | null;
  text_color: string | null;
  position: number;
  hidden: boolean;
}

const KIND_OPTIONS = [
  { value: "note", label: "Plain note", icon: StickyNote },
  { value: "quote", label: "Quote", icon: MessageSquareQuote },
  { value: "highlight", label: "Highlight", icon: Sparkles },
  { value: "ad", label: "Advertisement", icon: Megaphone },
];

export function CardEditor({
  card,
  onChange,
  onDelete,
  index,
  total,
  onMove,
  isPro = false,
}: {
  card: CardRow;
  onChange: (id: string, patch: Partial<CardRow>) => void;
  onDelete: (id: string) => void;
  index?: number;
  total?: number;
  onMove?: (delta: -1 | 1) => void;
  isPro?: boolean;
}) {
  const KindIcon = KIND_OPTIONS.find((k) => k.value === card.kind)?.icon ?? StickyNote;
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-3">
      <div className="flex items-start gap-2">
        {typeof index === "number" && typeof total === "number" && onMove && (
          <ReorderButtons index={index} total={total} vertical onMove={onMove} />
        )}
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <KindIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 grid gap-2 sm:grid-cols-[160px_1fr]">
          <Select value={card.kind} onValueChange={(v) => onChange(card.id, { kind: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <span className="flex items-center gap-2">
                    <o.icon className="h-3.5 w-3.5" /> {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Title (optional)"
            value={card.title ?? ""}
            onChange={(e) => onChange(card.id, { title: e.target.value || null })}
          />
        </div>
        <Switch checked={!card.hidden} onCheckedChange={(v) => onChange(card.id, { hidden: !v })} />
        <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-2 space-y-2">
        <Textarea
          rows={3}
          placeholder={card.kind === "quote" ? "“Your quote here…”" : "Card content…"}
          value={card.content}
          onChange={(e) => onChange(card.id, { content: e.target.value })}
        />

        {card.kind === "quote" && (
          <Input
            placeholder="Author (optional)"
            value={card.author ?? ""}
            onChange={(e) => onChange(card.id, { author: e.target.value || null })}
          />
        )}

        {card.kind === "ad" && (
          <>
            <Input
              placeholder="Image URL (optional)"
              value={card.image_url ?? ""}
              onChange={(e) => onChange(card.id, { image_url: e.target.value || null })}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Button label (optional)"
                value={card.cta_label ?? ""}
                onChange={(e) => onChange(card.id, { cta_label: e.target.value || null })}
              />
              <Input
                placeholder="https://link.com"
                value={card.cta_url ?? ""}
                onChange={(e) => onChange(card.id, { cta_url: e.target.value || null })}
              />
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {(card.kind === "highlight" ||
            card.kind === "ad" ||
            card.kind === "note" ||
            card.kind === "quote") && (
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              Background
              <input
                type="color"
                value={card.bg_color || "#1B3C53"}
                onChange={(e) => onChange(card.id, { bg_color: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent"
              />
              {card.bg_color && (
                <button
                  onClick={() => onChange(card.id, { bg_color: null })}
                  className="text-[11px] underline"
                >
                  Reset
                </button>
              )}
            </label>
          )}
          <label
            className={`flex items-center gap-2 text-xs font-medium ${isPro ? "text-muted-foreground" : "text-muted-foreground/60"}`}
          >
            <span className="flex items-center gap-1">
              Text
              {!isPro && (
                <span className="rounded-full bg-gradient-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                  PRO
                </span>
              )}
            </span>
            <input
              type="color"
              disabled={!isPro}
              value={card.text_color || "#ffffff"}
              onChange={(e) => onChange(card.id, { text_color: e.target.value })}
              className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
            {card.text_color && isPro && (
              <button
                onClick={() => onChange(card.id, { text_color: null })}
                className="text-[11px] underline"
              >
                Reset
              </button>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
