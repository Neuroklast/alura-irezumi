"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useStudio } from "./studio-provider";
import {
  cartSchema,
  orderSchema,
  type Cart,
  type Order,
} from "@/lib/shop/schema";
import { quoteCart, releasePaidItems } from "@/lib/shop/core";
const storageKey = "alura-print-demo-v1";
const cartKey = "alura-print-cart-v1";
type ShopContext = {
  cart: Cart;
  orders: Order[];
  ready: boolean;
  storageNotice: string;
  add: (variantId: string) => void;
  quantity: (variantId: string, value: number) => void;
  clear: () => void;
  demoCheckout: () => Order;
  updateDemo: (order: Order) => void;
  resetDemo: () => void;
  checkoutKey: string;
};
const Context = createContext<ShopContext | null>(null);
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { content, demo } = useStudio();
  const [cart, setCart] = useState<Cart>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  useEffect(() => {
    setCheckoutKey(crypto.randomUUID());
    try {
      const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      if (savedCart.length) setCart(cartSchema.parse(savedCart));
      if (demo)
        setOrders(
          orderSchema
            .array()
            .max(200)
            .parse(JSON.parse(localStorage.getItem(storageKey) || "[]")),
        );
    } catch {
      setStorageNotice(
        "Gespeicherte Shop-Daten konnten nicht geladen werden. Diese Sitzung startet leer.",
      );
    }
    setReady(true);
  }, [demo]);
  function storeCart(next: Cart) {
    setCart(next);
    setCheckoutKey(crypto.randomUUID());
    try {
      localStorage.setItem(cartKey, JSON.stringify(next));
    } catch {
      setStorageNotice(
        "Browserspeicher nicht verfügbar. Der Warenkorb bleibt nur in dieser Sitzung.",
      );
    }
  }
  function storeOrders(next: Order[]) {
    setOrders(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setStorageNotice(
        "Browserspeicher nicht verfügbar. Demobestellungen bleiben nur in dieser Sitzung.",
      );
    }
  }
  function quantity(variantId: string, value: number) {
    const count = Math.min(10, Math.max(0, Math.floor(value)));
    const exists = cart.some((i) => i.variantId === variantId);
    const next = cart
      .map((i) => (i.variantId === variantId ? { ...i, quantity: count } : i))
      .filter((i) => i.quantity > 0);
    if (!exists && count > 0) next.push({ variantId, quantity: count });
    if (next.length > 20)
      throw new Error("Maximal 20 verschiedene Varianten pro Bestellung.");
    storeCart(next);
  }
  function demoCheckout() {
    if (!demo) throw new Error("Demobestellungen sind im Live-Modus gesperrt.");
    if (orders.length >= 200)
      throw new Error(
        "Demo voll. Bitte Demobestellungen im Atelier zurücksetzen.",
      );
    const quote = quoteCart(content, cart);
    for (const item of quote.items) {
      const sold = orders
        .filter((o) => o.payment !== "failed")
        .flatMap((o) => o.items)
        .filter((i) => i.variantId === item.variantId)
        .reduce((n, i) => n + i.quantity, 0);
      if (item.stockMode === "limited" && sold + item.quantity > item.stock)
        throw new Error("Die gewünschte Stückzahl ist nicht mehr verfügbar.");
    }
    const order: Order = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      payment: "paid",
      customer: "Demo-Bestellung",
      email: "demo@example.invalid",
      address: "Musterstraße 1\n44787 Bochum\nDE",
      items: releasePaidItems(quote.items, "paid"),
      shipping: quote.shipping,
      total: quote.total,
      checkout_key: checkoutKey,
      session_id: null,
      payment_intent: null,
      return_status: "none",
      note: "Simulierte Zahlung. Keine echte Bestellung.",
      version: 0,
    };
    storeOrders([order, ...orders]);
    storeCart([]);
    return order;
  }
  return (
    <Context.Provider
      value={{
        cart,
        orders,
        ready,
        checkoutKey,
        storageNotice,
        quantity,
        add: (id) =>
          quantity(
            id,
            (cart.find((i) => i.variantId === id)?.quantity || 0) + 1,
          ),
        clear: () => storeCart([]),
        demoCheckout,
        updateDemo: (order) => {
          if (!demo) return;
          const valid = orderSchema.parse(order);
          storeOrders(orders.map((o) => (o.id === valid.id ? valid : o)));
        },
        resetDemo: () => storeOrders([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useShop() {
  const value = useContext(Context);
  if (!value) throw new Error("ShopProvider fehlt.");
  return value;
}
