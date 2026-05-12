import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Moves item at `index` by `delta` (-1 up, +1 down) within `items` and
 * persists new `position` values to `table` for the affected rows.
 * Returns the reordered array (with updated position numbers) for optimistic UI.
 */
export async function moveItem<T extends { id: string; position: number }>(
  items: T[],
  index: number,
  delta: -1 | 1,
  table: "link_groups" | "links" | "financial_methods",
): Promise<T[] | null> {
  const target = index + delta;
  if (target < 0 || target >= items.length) return null;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  // Reassign positions sequentially so ties never break ordering
  const withPos = next.map((it, i) => ({ ...it, position: i }));
  // Persist only the two swapped rows
  const a = withPos[index];
  const b = withPos[target];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from(table).update({ position: a.position }).eq("id", a.id),
    supabase.from(table).update({ position: b.position }).eq("id", b.id),
  ]);
  if (e1 || e2) {
    toast.error((e1 ?? e2)!.message);
    return null;
  }
  return withPos;
}
