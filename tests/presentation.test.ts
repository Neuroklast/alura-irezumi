import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Home } from "../src/components/site";
import { StudioProvider } from "../src/components/studio-provider";
import { demoContent } from "../src/lib/demo";

test("the public home exposes German chapters and direct material interaction without a range input", () => {
  const html = renderToStaticMarkup(
    createElement(StudioProvider, {
      initial: demoContent,
      version: 0,
      demo: true,
      integrations: { supabase: false, r2: false },
      children: createElement(Home),
    }),
  );
  assert.ok(html.includes("ALURA"));
  assert.ok(html.includes("Tattoos &amp; Spiegelgravuren."));
  assert.ok(html.includes("/art/vaporeon.svg"));
  assert.ok(html.includes("/art/laura-atelier.webp"));
  assert.equal(html.includes("mirror-frame"), false);
  for (const phrase of [
    "Deine Geschichte. Meine Linien.",
    "Kunst ohne Grenzen",
    "Unsere nächste Linie",
    "Viele Möglichkeiten.",
  ])
    assert.equal(html.includes(phrase), false);
  assert.ok(html.includes("Seitennavigation"));
  for (const kanji of ["一", "二", "三", "四", "五"])
    assert.ok(html.includes(kanji));
  assert.ok(html.includes("Nach links oder rechts wischen"));
  assert.ok(html.includes("Alternativ Pfeiltasten"));
  assert.equal(html.includes('type="range"'), false);
  assert.equal(html.includes("Under your skin"), false);
});
