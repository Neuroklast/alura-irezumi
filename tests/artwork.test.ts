import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demoContent } from "../src/lib/demo";
import { upgradeSeededContent } from "../src/lib/content-migration";
import { contentSchema } from "../src/lib/schema";
test("each supplied design is a real path-based SVG without embedded screenshots or active content", () => {
  for (const name of ["mew", "espeon", "marowak", "vaporeon"]) {
    const svg = readFileSync(
      new URL(`../public/art/${name}.svg`, import.meta.url),
      "utf8",
    );
    assert.ok(svg.includes("<path"));
    assert.ok(svg.includes("viewBox="));
    assert.ok(svg.includes("ALURA IREZUMI"));
    assert.equal(
      /<image|<script|foreignObject|data:image|onload=/.test(svg),
      false,
    );
  }
});
test("retiring old seed illustrations preserves uploaded work and authored biography", () => {
  const uploaded = {
    ...demoContent.works[0],
    id: "10000000-0000-4000-8000-000000000001",
    title: "Mein Upload",
    image: "https://images.example.org/original.png",
  };
  const legacy = contentSchema.parse({
    ...demoContent,
    bio: "Meine eigene Biografie",
    scene: { ...demoContent.scene, motif: "moth" },
    works: [{ ...demoContent.works[0], image: "/art/moth-skin.svg" }, uploaded],
  });
  const next = upgradeSeededContent(legacy);
  assert.equal(next.works.length, 5);
  assert.equal(next.works.at(-1)?.title, "Mein Upload");
  assert.equal(next.bio, "Meine eigene Biografie");
  assert.equal(next.scene.motif, "mew");
  assert.equal(
    upgradeSeededContent({ ...demoContent, works: [] }).works.length,
    0,
  );
});

test("both ink and native engraving assets retain transparent unpainted space", () => {
  for (const key of ["mew", "espeon", "marowak", "vaporeon"]) {
    const variants = ["", "-engraving"].map((suffix) =>
      readFileSync(
        new URL(`../public/art/${key}${suffix}.svg`, import.meta.url),
        "utf8",
      ),
    );
    assert.equal(
      variants[0].match(/viewBox="([^"]+)"/)?.[1],
      variants[1].match(/viewBox="([^"]+)"/)?.[1],
    );
    for (const svg of variants) {
      assert.equal(/<(?:rect|image|foreignObject|style)\b/.test(svg), false);
      assert.equal(/background\s*[:=]/.test(svg), false);
    }
    for (const svg of variants) {
      assert.equal(svg.includes('data-layer="shade"'), false);
      const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map(
        (match) => match[1],
      );
      assert.ok(fills.length > 0);
      assert.ok(fills.every((fill) => fill === "#000000"));
      assert.equal(/(?:fill-opacity|opacity)=/.test(svg), false);
    }
  }
});
test("skin photograph is the supplied second image and branding uses vector outlines", () => {
  const licenses = JSON.parse(
    readFileSync(
      new URL("../public/art/licenses.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(
    licenses["skin-natural.webp"].source,
    "image(20261018-111319).png",
  );
  assert.equal(licenses["skin-cc0.webp"], undefined);
  const logo = readFileSync(
    new URL("../public/brand/alura-wordmark.svg", import.meta.url),
    "utf8",
  );
  assert.ok(logo.includes("<path"));
  assert.equal(/<(?:image|text|rect)\b/.test(logo), false);
});
