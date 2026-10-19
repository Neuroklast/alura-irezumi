import { NextResponse } from "next/server";
import { after } from "next/server";
import type Stripe from "stripe";
import { boundedText, failure } from "@/lib/http";
import { isDemo } from "@/lib/config";
import { shopDb, stripe, deliverShopNotifications } from "@/lib/shop/server";
export async function POST(req: Request) {
  // Webhooks keep working after sales are paused, to reconcile existing payments.
  if (
    isDemo() ||
    !process.env.STRIPE_WEBHOOK_SECRET ||
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return failure("Webhook nicht eingerichtet.", 503);
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      await boundedText(req, 256000),
      req.headers.get("stripe-signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return failure("Ungültige Signatur oder Anfrage.");
  }
  try {
    const db = shopDb();
    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const intent =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
      if (!intent) return NextResponse.json({ received: true });
      const payment = await stripe().paymentIntents.retrieve(intent);
      if (!payment.metadata.order_id)
        return NextResponse.json({ received: true });
      // Read current cumulative refund amount to make out-of-order events monotonic.
      const current = await stripe().charges.retrieve(charge.id);
      const result = await db.rpc("apply_print_refund", {
        p_event: event.id,
        p_intent: intent,
        p_refunded: current.amount_refunded,
      });
      if (result.error)
        throw new Error("Erstattung konnte nicht verbucht werden.");
    } else if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
      ].includes(event.type)
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const id = session.metadata?.order_id;
      if (!id) return NextResponse.json({ received: true });
      if (session.mode !== "payment" || session.currency !== "eur")
        return failure("Unerwarteter Zahlungstyp.");
      const paid =
        session.payment_status === "paid" &&
        [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
        ].includes(event.type);
      const failed = [
        "checkout.session.expired",
        "checkout.session.async_payment_failed",
      ].includes(event.type);
      if (!paid && !failed) return NextResponse.json({ received: true });
      const customer = session.customer_details;
      const address =
        session.collected_information?.shipping_details?.address ||
        customer?.address;
      const result = await db.rpc("apply_print_event", {
        p_event: event.id,
        p_order: id,
        p_session: session.id,
        p_action: paid ? "paid" : "failed",
        p_total: session.amount_total || 0,
        p_customer:
          session.collected_information?.shipping_details?.name ||
          customer?.name ||
          "",
        p_email: customer?.email || "",
        p_address: address
          ? [
              address.line1,
              address.line2,
              `${address.postal_code || ""} ${address.city || ""}`,
              address.country,
            ]
              .filter(Boolean)
              .join("\n")
          : "",
        p_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || "",
      });
      if (result.error)
        throw new Error("Zahlung konnte nicht verbucht werden.");
    } else return NextResponse.json({ received: true });
    after(async () => {
      try {
        await deliverShopNotifications();
      } catch {
        /* Pending outbox is visible in admin; retry there. */
      }
    });
    return NextResponse.json({ received: true });
  } catch {
    return failure(
      "Verarbeitung fehlgeschlagen. Erneute Zustellung erforderlich.",
      503,
    );
  }
}
