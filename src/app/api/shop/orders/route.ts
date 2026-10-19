import { NextResponse, after } from "next/server";
import { z } from "zod";
import { isDemo } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase";
import { boundedJson, failure, sameOrigin } from "@/lib/http";
import { deliverShopNotifications } from "@/lib/shop/server";
const patchSchema = z.object({ id: z.string().uuid(), version: z.number().int().nonnegative(),
  items: z.array(z.object({ variantId: z.string().uuid(), fulfillment: z.enum(["unassigned","manual","pod"]), status: z.enum(["blocked","ready","processing","shipped","cancelled"]), tracking: z.string().max(120) })).min(1).max(20),
  return_status: z.enum(["none","requested","received","closed"]), note: z.string().max(2000),
});
export async function GET(req: Request) {
  if (isDemo()) return failure("Demobestellungen bleiben in diesem Browser.");
  const db = await requireAdmin();
  if (!db) return failure("Nicht angemeldet.", 401);
  const page = Math.min(10000, Math.max(0, Number(new URL(req.url).searchParams.get("page")) || 0));
  const orders = await db.from("shop_orders").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * 20, page * 20 + 19);
  const notifications = await db.from("shop_notifications").select("id,order_id,kind,error,sent_at,created_at").is("sent_at", null).order("created_at", { ascending: false }).limit(100);
  if (orders.error || notifications.error) return failure("Shop-Daten konnten nicht geladen werden. Shop-Migration und Rechte prüfen.", 503);
  return NextResponse.json({ orders: orders.data, total: orders.count, notifications: notifications.data, mailConfigured: !!(process.env.RESEND_API_KEY && process.env.SHOP_NOTIFY_TO && process.env.SHOP_NOTIFY_FROM) }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  if (isDemo()) return failure("Demoänderungen bleiben im Browser.");
  const db = await requireAdmin();
  if (!db) return failure("Nicht angemeldet.", 401);
  try {
    const input = patchSchema.parse(await boundedJson(req, 16000));
    const result = await db.rpc("update_print_order", { p_id: input.id, p_version: input.version, p_items: input.items, p_return: input.return_status, p_note: input.note });
    if (result.error) return failure("Änderung nicht gespeichert. Zahlungsstatus prüfen oder Bestellungen neu laden.", 409);
    return NextResponse.json({ order: result.data });
  } catch { return failure("Ungültige Bestelldaten."); }
}
export async function POST(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  if (isDemo()) return failure("In der Demo werden keine E-Mails versendet.");
  if (!await requireAdmin()) return failure("Nicht angemeldet.", 401);
  if (!process.env.RESEND_API_KEY || !process.env.SHOP_NOTIFY_TO || !process.env.SHOP_NOTIFY_FROM) return failure("E-Mail-Versand noch nicht eingerichtet.", 503);
  after(async () => { try { await deliverShopNotifications(); } catch {} });
  return NextResponse.json({ queued: true });
}
