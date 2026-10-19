import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { boundedJson, failure, sameOrigin } from "@/lib/http";
import { checkoutSchema, orderSchema } from "@/lib/shop/schema";
import { quoteCart } from "@/lib/shop/core";
import { getContent } from "@/lib/content";
import { checkoutEnabled, shopDb, stripe } from "@/lib/shop/server";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  if (!checkoutEnabled())
    return failure(
      "Der Print-Shop ist noch nicht für echte Bestellungen freigeschaltet.",
      503,
    );
  try {
    const origin = new URL(process.env.SHOP_ORIGIN!).origin;
    if (new URL(req.url).origin !== origin)
      return failure("Checkout nur auf der Shop-Domain verfügbar.", 403);
    const input = checkoutSchema.parse(await boundedJson(req, 10000));
    const db = shopDb();
    const ip =
      process.env.VERCEL === "1"
        ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
        : null;
    if (!ip)
      return failure(
        "Checkout auf dieser Hostingumgebung nicht eingerichtet.",
        503,
      );
    const fingerprint = createHmac("sha256", process.env.RATE_LIMIT_SECRET!)
      .update(`shop:${ip}`)
      .digest("hex");
    const rate = await db.rpc("consume_enquiry_rate", { fingerprint });
    if (rate.error) return failure("Bestellungen gerade nicht verfügbar.", 503);
    if (!rate.data)
      return failure(
        "Zu viele Bestellversuche. Bitte später erneut versuchen.",
        429,
      );
    const content = await getContent();
    if (!content.content.shop.deliveryNote.trim())
      return failure("Versandangaben noch nicht eingerichtet.", 503);
    const quote = quoteCart(content.content, input.items, true);
    const reservation = await db.rpc("reserve_print_order", {
      p_key: input.key,
      p_items: quote.items,
      p_shipping: quote.shipping,
      p_total: quote.total,
      p_version: content.version,
    });
    if (reservation.error)
      return failure(
        "Bestand oder Katalog hat sich geändert. Bitte Warenkorb prüfen und neu laden.",
        409,
      );
    const order = orderSchema.parse(reservation.data);
    // Reuse exact parameters and a fixed expiry when retrying an interrupted Stripe request.
    const expires =
      Math.floor(new Date(order.created_at).getTime() / 1000) + 3600;
    if (expires < Math.floor(Date.now() / 1000) + 1800 && !order.session_id)
      return failure(
        "Dieser Bestellversuch ist zu alt. Bitte im Atelier prüfen lassen.",
        409,
      );
    const api = stripe();
    const session = order.session_id
      ? await api.checkout.sessions.retrieve(order.session_id)
      : await api.checkout.sessions.create(
          {
            mode: "payment",
            allowed_payment_method_types: ["card"],
            locale: "de",
            billing_address_collection: "required",
            shipping_address_collection: { allowed_countries: ["DE"] },
            client_reference_id: order.id,
            metadata: { order_id: order.id },
            payment_intent_data: { metadata: { order_id: order.id } },
            expires_at: expires,
            success_url: `${origin}/prints?checkout=success`,
            cancel_url: `${origin}/prints?checkout=cancelled`,
            line_items: [
              ...order.items.map((i) => ({
                quantity: i.quantity,
                price_data: {
                  currency: "eur",
                  unit_amount: i.price,
                  product_data: { name: `${i.title} · ${i.label}` },
                },
              })),
              ...(order.shipping
                ? [
                    {
                      quantity: 1,
                      price_data: {
                        currency: "eur",
                        unit_amount: order.shipping,
                        product_data: {
                          name: "Versand innerhalb Deutschlands",
                        },
                      },
                    },
                  ]
                : []),
            ],
          },
          { idempotencyKey: `alura-order-${order.id}` },
        );
    if (session.status !== "open" || !session.url)
      return failure("Checkout bereits abgeschlossen oder abgelaufen.", 409);
    const binding = await db
      .from("shop_orders")
      .update({ session_id: session.id })
      .eq("id", order.id)
      .is("session_id", null);
    if (binding.error)
      return failure(
        "Checkout konnte nicht gespeichert werden. Bitte erneut versuchen.",
        503,
      );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Print") || error.message.includes("Stückzahl"))
    )
      return failure(error.message);
    return failure(
      "Checkout konnte nicht gestartet werden. Bitte erneut versuchen.",
      503,
    );
  }
}
