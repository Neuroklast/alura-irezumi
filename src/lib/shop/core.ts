import type { Content } from "../schema";
import { cartSchema, type Cart, type Order, type OrderItem, type Shop } from "./schema";
export function variantLabel(v: { format: string; paper: string; edition: string }) {
  return [v.format, v.paper, v.edition].filter(Boolean).join(" · ");
}
/** Prices and routing are always resolved from the catalog, never from browser totals. */
export function quoteCart(content: Content, input: Cart, live = false) {
  const cart = cartSchema.parse(input);
  const quantities = new Map<string, number>();
  for (const line of cart) quantities.set(line.variantId, (quantities.get(line.variantId) || 0) + line.quantity);
  const items: OrderItem[] = [];
  for (const [id, quantity] of quantities) {
    const product = content.shop.products.find(p => p.published && p.variants.some(v => v.id === id));
    const variant = product?.variants.find(v => v.id === id && v.active);
    if (!product || !variant || !content.works.some(w => w.id === product.artworkId)) throw new Error("Ein Print ist nicht mehr verfügbar. Bitte Warenkorb prüfen.");
    if (quantity > 10 || (variant.stockMode === "limited" && quantity > variant.stock)) throw new Error("Die gewünschte Stückzahl ist nicht verfügbar.");
    const fulfillment = variant.fulfillment === "inherit" ? content.shop.defaultFulfillment : variant.fulfillment;
    if (live && fulfillment !== "manual") throw new Error("Für diesen Print ist der Versand noch nicht eingerichtet.");
    items.push({ variantId: id, productId: product.id, title: product.title, label: variantLabel(variant), quantity, price: variant.price, fulfillment, stockMode: variant.stockMode, stock: variant.stock, status: "blocked", tracking: "" });
  }
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  return { items, subtotal, shipping: content.shop.shipping, total: subtotal + content.shop.shipping };
}
export interface FulfillmentProvider { readonly id: "manual" | "pod"; prepare(item: OrderItem, payment: Order["payment"]): OrderItem; }
export class ManualFulfillmentProvider implements FulfillmentProvider {
  readonly id = "manual";
  prepare(item: OrderItem, payment: Order["payment"]) {
    if (payment !== "paid") throw new Error("Versand erst nach bestätigter Zahlung.");
    return { ...item, status: "ready" as const };
  }
}
export class PrintOnDemandProvider implements FulfillmentProvider {
  readonly id = "pod";
  prepare(): OrderItem { throw new Error("Noch kein Print-on-Demand-Anbieter angeschlossen."); }
}
export function releasePaidItems(items: OrderItem[], payment: Order["payment"]) {
  return items.map(item => payment === "paid" && item.fulfillment === "manual" && item.status === "blocked"
    ? new ManualFulfillmentProvider().prepare(item, payment) : item);
}
export function demoCatalog(works: Content["works"]): Shop {
  return {
    defaultFulfillment: "unassigned", shipping: 490, deliveryNote: "Beispielprodukte mit Demopreisen. Noch nicht bestellbar.",
    products: works.map((w, i) => ({
      id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      artworkId: w.id, title: w.title, description: "Format und Papier auswählen.", published: true,
      variants: ["A4", "A3"].map((format, n) => ({
        id: `20000000-0000-4000-8000-${String(i * 2 + n + 1).padStart(12, "0")}`,
        format, paper: "Mattes Kunstdruckpapier", edition: "", price: n ? 3500 : 2200,
        stockMode: "on_demand" as const, stock: 0, fulfillment: "inherit" as const, active: true,
      })),
    })),
  };
}
