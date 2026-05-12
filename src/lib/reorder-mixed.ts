import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MixedItem = {
  id: string;
  position: number;
  table: "links" | "link_cards";
};

/**
 * Swap positions between two adjacent items that may live in different tables.
 * Persists both rows' new positions.
 */
export async function moveMixed(items: MixedItem[], index: number, delta: -1 | 1) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return null;
  const a = items[index];
  const b = items[target];
  const aPos = b.position;
  const bPos = a.position;
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from(a.table).update({ position: aPos }).eq("id", a.id),
    supabase.from(b.table).update({ position: bPos }).eq("id", b.id),
  ]);
  if (e1 || e2) {
    toast.error((e1 ?? e2)!.message);
    return null;
  }
  return true;
}
