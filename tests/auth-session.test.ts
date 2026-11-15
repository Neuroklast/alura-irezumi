import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/app/api/auth/route.ts", import.meta.url), "utf8");

test("failed admin login does not revoke separate sessions", () => {
  assert.ok(route.includes('db.auth.signOut({ scope: "local" })'));
  assert.ok(!route.includes("db.auth.signOut()"));
});

test("explicit DELETE logout checks upstream errors before responding with success", () => {
  const logout = route.slice(route.indexOf("export async function DELETE"));
  assert.ok(logout.includes('const { error } = await db.auth.signOut({ scope: "local" })'));
  assert.ok(logout.includes('if (error) return failure("Abmelden fehlgeschlagen.", 503)'));
  assert.ok(logout.includes("sameOrigin(req)"));
});
