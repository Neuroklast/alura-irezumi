import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { isDemo, integrationStatus } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase";
import { boundedJson, failure, sameOrigin } from "@/lib/http";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return failure("Ungültiger Ursprung.", 403);
  if (isDemo()) return failure("Demo-Uploads bleiben im Browser.");
  if (!(await requireAdmin())) return failure("Nicht angemeldet.", 401);
  if (!integrationStatus().r2) return failure("R2 ist nicht verbunden.", 503);
  try {
    const input = z
      .object({
        type: z.enum(["image/png", "image/jpeg", "image/webp"]),
        size: z
          .number()
          .int()
          .positive()
          .max(10 * 1024 * 1024),
      })
      .parse(await boundedJson(req, 2000));
    const ext = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    }[input.type];
    const key = `artworks/${crypto.randomUUID()}.${ext}`;
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: input.type,
        ContentLength: input.size,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: 120 },
    );
    const publicUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch {
    return failure("Upload konnte nicht vorbereitet werden.");
  }
}
