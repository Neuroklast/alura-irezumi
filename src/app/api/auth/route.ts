import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemo } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import { sameOrigin, failure, boundedJson } from "@/lib/http";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  if (isDemo())
    return failure("Im Demo-Modus ist keine Anmeldung notwendig.", 400);
  try {
    const input = z
      .object({
        email: z.string().email().max(254),
        password: z.string().min(1).max(200),
      })
      .parse(await boundedJson(req, 2000));
    const db = await supabase();
    const { data, error } = await db.auth.signInWithPassword(input);
    if (error || data.user?.app_metadata.role !== "admin") {
      await db.auth.signOut();
      return failure("Anmeldung fehlgeschlagen.", 401);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return failure("Anmeldung fehlgeschlagen.", 400);
  }
}
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  if (!isDemo()) {
    const db = await supabase();
    await db.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
