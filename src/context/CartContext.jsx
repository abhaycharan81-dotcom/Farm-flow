import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const EMPTY = { storeId: null, lines: {} };

// The cart survives refreshes and accidental tab closes (kept per signed-in user on this device).
const load = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      storeId: parsed.storeId || null,
      lines: parsed.lines && typeof parsed.lines === "object" ? parsed.lines : {},
    };
  } catch {
    return EMPTY;
  }
};

// A cart belongs to one store at a time (one order = one seller).
export function CartProvider({ children, restrictedStoreId }) {
  const { user } = useAuth();
  const key = `cart:${user?.uid || "guest"}`;
  const [state, setState] = useState(() => {
    const cart = load(key);
    return restrictedStoreId && cart.storeId !== restrictedStoreId ? EMPTY : cart;
  }); // { storeId, lines: { [productId]: { productId, name, price, unit, qty, max } } }

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* storage full or blocked: cart still works in memory */ }
  }, [key, state]);

  const add = (store, product) => {
    if (restrictedStoreId && store.id !== restrictedStoreId) return;
    if (state.storeId && state.storeId !== store.id) {
      if (!window.confirm("Your cart has items from another store. Start a new cart?")) return;
    }
    setState((prev) => {
      const lines = prev.storeId && prev.storeId !== store.id ? {} : prev.lines;
      const qty = Math.min((lines[product.id]?.qty || 0) + 1, product.stock);
      return {
        storeId: store.id,
        lines: {
          ...lines,
          [product.id]: { productId: product.id, name: product.name, price: product.price, unit: product.unit, qty, max: product.stock },
        },
      };
    });
  };

  const setQty = (productId, qty) =>
    setState((prev) => {
      const lines = { ...prev.lines };
      if (!lines[productId]) return prev;
      if (qty <= 0) delete lines[productId];
      else lines[productId] = { ...lines[productId], qty: Math.min(qty, lines[productId].max) };
      return { ...prev, lines };
    });

  const clear = () => setState(EMPTY);

  const items = Object.values(state.lines);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ storeId: state.storeId, items, total, count, add, setQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}
