import { NextResponse } from "next/server";
import { isDemo } from "@/lib/config";
import { enquirySchema } from "@/lib/enquiry";
import { boundedJson, failure, sameOrigin } from "@/lib/http";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  try {
    const parsed = enquirySchema.safeParse(await boundedJson(req, 12_000));
    if (!parsed.success)
      return failure("Bitte alle Pflichtfelder korrekt ausfüllen.");
    const { website, consent, ...input } = parsed.data;
    if (website) return NextResponse.json({ ok: true, demo: isDemo() });
    if (isDemo()) return NextResponse.json({ ok: true, demo: true });
    if (
      process.env.ENQUIRIES_ENABLED !== "true" ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.RATE_LIMIT_SECRET
    )
      return failure(
        "Online-Anfragen sind noch nicht freigeschaltet. Bitte kontaktiere Laura über Instagram.",
        503,
      );
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    // Use the Vercel-controlled header only. Other hosting platforms need a trusted IP adapter.
    const ip =
      process.env.VERCEL === "1"
        ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
        : null;
    if (!ip)
      return failure(
        "Anfragen sind auf dieser Hostingumgebung nicht konfiguriert.",
        503,
      );
    const fingerprint = createHmac("sha256", process.env.RATE_LIMIT_SECRET)
      .update(ip)
      .digest("hex");
    const { data: allowed, error: rateError } = await db.rpc(
      "consume_enquiry_rate",
      { fingerprint },
    );
    if (rateError)
      return failure("Anfragen sind vorübergehend nicht verfügbar.", 503);
    if (!allowed)
      return failure("Zu viele Anfragen. Bitte später erneut versuchen.", 429);
    const { error } = await db
      .from("enquiries")
      .insert({ ...input, consent_at: new Date().toISOString() });
    if (error)
      return failure("Die Anfrage konnte nicht gespeichert werden.", 500);
    return NextResponse.json({ ok: true, demo: false });
  } catch {
    return failure("Ungültige Anfrage.");
  }
}
