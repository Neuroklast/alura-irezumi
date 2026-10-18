import { test } from "node:test";
import assert from "node:assert/strict";
import { contentSchema } from "../src/lib/schema";
import { demoContent } from "../src/lib/demo";
import { isDemo, integrationStatus } from "../src/lib/config";
import { boundedJson, sameOrigin } from "../src/lib/http";
import { enquirySchema } from "../src/lib/enquiry";
import { POST } from "../src/app/api/enquiries/route";
const valid = {
  name: "Demo User",
  email: "demo@example.org",
  type: "tattoo",
  motif: "Moth",
  placement: "Arm",
  size: "15 cm",
  message: "Ein eigenes Motiv als Tattoo.",
  consent: "yes",
  website: "",
};
function req(body: unknown, origin = "https://alura.example") {
  return new Request("https://alura.example/api/enquiries", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
test("the shipped demo is valid and has both artwork materials", () => {
  assert.equal(contentSchema.parse(demoContent).works.length, 6);
  assert.ok(demoContent.works.some((w) => w.category === "tattoo"));
  assert.ok(demoContent.works.some((w) => w.category === "mirror"));
});
test("active and unsupported image sources are rejected, including SVG data URIs", () => {
  for (const image of [
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "http://insecure.example/a.png",
    "/art/../../api/auth",
  ]) {
    assert.equal(
      contentSchema.safeParse({
        ...demoContent,
        works: [{ ...demoContent.works[0], image }],
      }).success,
      false,
    );
  }
});
test("custom transparent raster hero assets are supported but bounded", () => {
  assert.equal(
    contentSchema.safeParse({
      ...demoContent,
      scene: {
        ...demoContent.scene,
        customImage: "data:image/png;base64,YWJj",
      },
    }).success,
    true,
  );
  assert.equal(
    contentSchema.safeParse({
      ...demoContent,
      scene: { ...demoContent.scene, surface: 101 },
    }).success,
    false,
  );
});
test("no Supabase variables means a fully usable demo even with a partial R2 configuration", () => {
  const keys = [
    "DEMO_MODE",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const previous = keys.map((k) => process.env[k]);
  try {
    keys.forEach((k) => delete process.env[k]);
    assert.equal(isDemo(), true);
    assert.equal(integrationStatus().supabase, false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    assert.equal(isDemo(), true);
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "demo";
    assert.equal(isDemo(), false);
    process.env.DEMO_MODE = "true";
    assert.equal(isDemo(), true);
  } finally {
    keys.forEach((k, i) => {
      if (previous[i] === undefined) delete process.env[k];
      else process.env[k] = previous[i];
    });
  }
});
test("mutations require an explicit matching origin", () => {
  assert.equal(sameOrigin(req(valid)), true);
  assert.equal(sameOrigin(req(valid, "https://attacker.example")), false);
  assert.equal(
    sameOrigin(new Request("https://alura.example/api/enquiries")),
    false,
  );
});
test("request size bound is enforced on streamed bytes without Content-Length", async () => {
  await assert.rejects(() =>
    boundedJson(req({ message: "a".repeat(200) }), 100),
  );
  assert.deepEqual(await boundedJson(req({ ok: true }), 100), { ok: true });
});
test("contact validation requires real consent and a substantive message", () => {
  assert.equal(enquirySchema.safeParse(valid).success, true);
  assert.equal(
    enquirySchema.safeParse({ ...valid, consent: "no" }).success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({ ...valid, email: "invalid" }).success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({ ...valid, message: "  short  " }).success,
    false,
  );
});
test("demo contact validates input and returns a clear no-persistence response without services", async () => {
  const prev = process.env.DEMO_MODE;
  process.env.DEMO_MODE = "true";
  try {
    const res = await POST(req(valid));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, demo: true });
    assert.equal((await POST(req({ ...valid, consent: "no" }))).status, 400);
    assert.equal(
      (await POST(req(valid, "https://attacker.example"))).status,
      403,
    );
    assert.equal(
      (await POST(req({ ...valid, message: "a".repeat(15000) }))).status,
      400,
    );
  } finally {
    if (prev === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = prev;
  }
});
