import "server-only";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { isDemo } from "../config";
export function checkoutEnabled() {
  return !isDemo() && process.env.SHOP_ENABLED === "true" && !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RATE_LIMIT_SECRET && process.env.SHOP_ORIGIN);
}
export function shopDb() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Shop-Datenbank nicht eingerichtet.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function stripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!); }
/** Optional transactional mail. Outbox persists even when no mail provider is configured. */
export async function deliverShopNotifications() {
  const db = shopDb();
  const { data, error } = await db.from("shop_notifications").select("id,order_id,kind").is("sent_at", null).order("created_at").limit(20);
  if (error) throw new Error("Benachrichtigungen konnten nicht geladen werden.");
  if (!process.env.RESEND_API_KEY || !process.env.SHOP_NOTIFY_TO || !process.env.SHOP_NOTIFY_FROM) return;
  for (const entry of data || []) {
    const labels: Record<string, string> = { paid: "Neue bezahlte Bestellung", problem: "Zahlung abgebrochen", refund: "Erstattung" };
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `alura-${entry.id}` },
        body: JSON.stringify({ from: process.env.SHOP_NOTIFY_FROM, to: [process.env.SHOP_NOTIFY_TO], subject: `ALURA · ${labels[entry.kind] || "Bestellung"}`, text: `${labels[entry.kind] || "Bestellung"}\nBestellnummer: ${entry.order_id}\nIm Atelier ansehen: ${process.env.SHOP_ORIGIN}/admin\nKundendaten stehen nur im geschützten Atelier.` }),
      });
      if (!response.ok) throw new Error("Mailanbieter hat den Versand abgelehnt.");
      const { error: updateError } = await db.from("shop_notifications").update({ sent_at: new Date().toISOString(), error: "" }).eq("id", entry.id);
      if (updateError) throw new Error("Versandstatus konnte nicht gespeichert werden.");
    } catch {
      await db.from("shop_notifications").update({ error: "E-Mail nicht bestätigt. Versandkonfiguration prüfen und erneut versuchen." }).eq("id", entry.id);
    }
  }
}
