"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  /** fontSlug + licenseId, unique per line so the same font can carry multiple licenses */
  id: string;
  fontName: string;
  fontSlug: string;
  licenseId: string;
  licenseName: string;
  price: number;
  currency: string;
}

interface CartContextValue {
  items: CartItem[];
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pulpenitem_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once on mount (client only)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  // Persist on every change, after initial hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage might be unavailable (private mode, quota) — fail silently
    }
  }, [items, hydrated]);

  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const deduped = newItems.filter((i) => !existingIds.has(i.id));
      return [...prev, ...deduped];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, addItems, removeItem, clearCart, itemCount: items.length, isInCart }),
    [items, addItems, removeItem, clearCart, isInCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
