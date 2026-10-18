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
  assert.ok(html.includes("Unter die Haut."));
  assert.ok(html.includes("Durch den Spiegel."));
  assert.ok(html.includes("Seitennavigation"));
  for (const kanji of ["一", "二", "三", "四", "五"])
    assert.ok(html.includes(kanji));
  assert.ok(html.includes("Nach links oder rechts wischen"));
  assert.ok(html.includes("Materialknöpfe oder Pfeiltasten"));
  assert.equal(html.includes('type="range"'), false);
  assert.equal(html.includes("Under your skin"), false);
});
