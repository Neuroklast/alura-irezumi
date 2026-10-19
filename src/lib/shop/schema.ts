import { z } from "zod";
export const fulfillmentSchema = z.enum(["unassigned", "manual", "pod"]);
export const variantSchema = z.object({
  id: z.string().uuid(),
  format: z.string().trim().min(1).max(40),
  paper: z.string().trim().min(1).max(80),
  edition: z.string().trim().max(80).default(""),
  price: z.number().int().min(100).max(1000000),
  stockMode: z.enum(["unlimited", "limited", "on_demand"]),
  stock: z.number().int().min(0).max(100000),
  fulfillment: z.enum(["inherit", "unassigned", "manual", "pod"]),
  active: z.boolean(),
});
export const productSchema = z.object({
  id: z.string().uuid(),
  artworkId: z.string().uuid(),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1500),
  published: z.boolean(),
  variants: z.array(variantSchema).min(1).max(24),
});
export const emptyShop = {
  products: [],
  defaultFulfillment: "unassigned" as const,
  shipping: 490,
  deliveryNote: "",
};
export const shopSchema = z
  .object({
    products: z.array(productSchema).max(60),
    defaultFulfillment: fulfillmentSchema,
    shipping: z.number().int().min(0).max(10000),
    deliveryNote: z.string().trim().max(300),
  })
  .superRefine((shop, ctx) => {
    const ids = shop.products.flatMap((p) => [
      p.id,
      ...p.variants.map((v) => v.id),
    ]);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Produkt- und Varianten-IDs müssen eindeutig sein.",
      });
  });
export const cartSchema = z
  .array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().min(1).max(10),
    }),
  )
  .min(1)
  .max(20);
export const checkoutSchema = z.object({
  items: cartSchema,
  key: z.string().uuid(),
});
export const orderItemSchema = z.object({
  variantId: z.string().uuid(),
  productId: z.string().uuid(),
  title: z.string(),
  label: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  fulfillment: fulfillmentSchema,
  stockMode: z.enum(["unlimited", "limited", "on_demand"]),
  stock: z.number().int().nonnegative(),
  status: z.enum(["blocked", "ready", "processing", "shipped", "cancelled"]),
  tracking: z.string().max(120).default(""),
});
export const orderSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  payment: z.enum([
    "pending",
    "paid",
    "failed",
    "refunded",
    "partially_refunded",
  ]),
  customer: z.string(),
  email: z.string(),
  address: z.string(),
  items: z.array(orderItemSchema),
  shipping: z.number().int(),
  total: z.number().int(),
  checkout_key: z.string().uuid(),
  session_id: z.string().nullable().default(null),
  payment_intent: z.string().nullable().default(null),
  return_status: z
    .enum(["none", "requested", "received", "closed"])
    .default("none"),
  note: z.string().max(2000).default(""),
  version: z.number().int().default(0),
});
export type Shop = z.infer<typeof shopSchema>;
export type Product = z.infer<typeof productSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Fulfillment = z.infer<typeof fulfillmentSchema>;
export const fulfillmentLabels = {
  unassigned: "Noch offen",
  manual: "Selbstversand",
  pod: "Print-on-Demand",
};
export const paymentLabels = {
  pending: "Zahlung offen",
  paid: "Bezahlt",
  failed: "Abgebrochen",
  refunded: "Erstattet",
  partially_refunded: "Teilweise erstattet",
};
export const itemStatusLabels = {
  blocked: "Wartet",
  ready: "Bereit",
  processing: "In Bearbeitung",
  shipped: "Versendet",
  cancelled: "Storniert",
};
export function euro(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
