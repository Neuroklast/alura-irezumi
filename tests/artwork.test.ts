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
