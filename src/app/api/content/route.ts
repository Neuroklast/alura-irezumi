import { NextResponse } from "next/server";
import { contentSchema } from "@/lib/schema";
import { isDemo } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase";
import { boundedJson, failure, sameOrigin } from "@/lib/http";
import { z } from "zod";
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  if (isDemo())
    return failure("Demoänderungen werden nur im Browser gespeichert.");
  const db = await requireAdmin();
  if (!db) return failure("Nicht angemeldet.", 401);
  try {
    const { content, version } = z
      .object({
        content: contentSchema,
        version: z.number().int().nonnegative(),
      })
      .parse(await boundedJson(req, 200_000));
    if (
      content.works.some((w) => w.image.startsWith("data:")) ||
      content.scene.customImage?.startsWith("data:")
    )
      return failure("Live-Bilder bitte zu R2 hochladen.");
    const { data, error } = await db
      .from("site_content")
      .update({ content, version: version + 1 })
      .eq("id", 1)
      .eq("version", version)
      .select("version")
      .maybeSingle();
    if (error) return failure("Speichern fehlgeschlagen.", 500);
    if (!data)
      return failure(
        "Die Inhalte wurden inzwischen geändert. Bitte Seite neu laden und Änderungen erneut prüfen.",
        409,
      );
    return NextResponse.json({ version: data.version });
  } catch {
    return failure("Ungültige Inhalte oder Anfrage zu groß.");
  }
}
