"use client";

import { useEffect, useMemo, useState } from "react";

export type CartItem = { productId: string; qty: number };

const KEY = "mytapcart_v1";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
  }, []);

  useEffect(() => {
    writeCart(items);
  }, [items]);

  const count = useMemo(
    () => items.reduce((a, b) => a + (Number(b.qty) || 0), 0),
    [items]
  );

  const add = (productId: string, qty = 1) => {
    const q = Math.max(1, Number(qty || 1));
    setItems((prev) => {
      const next = [...prev];
      const i = next.findIndex((x) => x.productId === productId);
      if (i >= 0) next[i] = { productId, qty: next[i].qty + q };
      else next.push({ productId, qty: q });
      return next;
    });
  };

  const setQty = (productId: string, qty: number) => {
    const q = Math.max(1, Number(qty || 1));
    setItems((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, qty: q } : x))
    );
  };

  const remove = (productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  };

  const clear = () => setItems([]);

  return { items, count, add, setQty, remove, clear };
}
