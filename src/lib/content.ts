import "server-only";
import { demoContent } from "./demo";
import { contentSchema } from "./schema";
import { isDemo } from "./config";
import { supabase } from "./supabase";
export async function getContent() {
  if (isDemo()) return { content: demoContent, version: 0 };
  const db = await supabase();
  const { data, error } = await db
    .from("site_content")
    .select("content,version")
    .eq("id", 1)
    .single();
  if (error)
    throw new Error(
      "Inhalte konnten nicht geladen werden. Bitte Supabase-Migration und öffentliche Leserechte prüfen.",
    );
  return {
    content: contentSchema.parse(data.content),
    version: data.version as number,
  };
}
