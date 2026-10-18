import { NextResponse } from "next/server";
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !!origin && origin === new URL(req.url).origin;
}
export function failure(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
export async function boundedJson(req: Request, maxBytes = 64_000) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Leere Anfrage");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("Anfrage zu groß");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
