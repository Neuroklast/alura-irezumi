import { test } from "node:test";
import assert from "node:assert/strict";
import { demoContent } from "../src/lib/demo";
import { contentSchema } from "../src/lib/schema";
import {
  quoteCart,
  releasePaidItems,
  ManualFulfillmentProvider,
  PrintOnDemandProvider,
} from "../src/lib/shop/core";
const variant = demoContent.shop.products[0].variants[0];
test("shop migration defaults existing live content to an empty catalog", () => {
  const { shop, ...old } = demoContent;
  assert.deepEqual(contentSchema.parse(old).shop.products, []);
  assert.equal(contentSchema.parse(old).shop.defaultFulfillment, "unassigned");
});
test("cart resolves canonical prices and combines duplicate lines before checking stock", () => {
  const quote = quoteCart(demoContent, [
    { variantId: variant.id, quantity: 2 },
    { variantId: variant.id, quantity: 1 },
  ]);
  assert.equal(quote.items.length, 1);
  assert.equal(quote.items[0].quantity, 3);
  assert.equal(quote.total, variant.price * 3 + demoContent.shop.shipping);
  const finite = structuredClone(demoContent);
  finite.shop.products[0].variants[0].stockMode = "limited";
  finite.shop.products[0].variants[0].stock = 2;
  assert.throws(() =>
    quoteCart(finite, [
      { variantId: variant.id, quantity: 2 },
      { variantId: variant.id, quantity: 1 },
    ]),
  );
  assert.throws(() =>
    quoteCart(demoContent, [
      { variantId: variant.id, quantity: 10 },
      { variantId: variant.id, quantity: 1 },
    ]),
  );
});
test("hidden, inactive and orphaned prints cannot be ordered", () => {
  for (const mutate of [
    (c: typeof demoContent) => (c.shop.products[0].published = false),
    (c: typeof demoContent) => (c.shop.products[0].variants[0].active = false),
    (c: typeof demoContent) => (c.works = []),
  ]) {
    const c = structuredClone(demoContent);
    mutate(c);
    assert.throws(() => quoteCart(c, [{ variantId: variant.id, quantity: 1 }]));
  }
});
test("unassigned and disconnected POD are blocked for live checkout and unpaid fulfillment", () => {
  const cart = [{ variantId: variant.id, quantity: 1 }];
  assert.throws(() => quoteCart(demoContent, cart, true));
  const c = structuredClone(demoContent);
  c.shop.defaultFulfillment = "manual";
  const quote = quoteCart(c, cart, true);
  assert.equal(releasePaidItems(quote.items, "pending")[0].status, "blocked");
  assert.equal(releasePaidItems(quote.items, "paid")[0].status, "ready");
  assert.throws(() =>
    new ManualFulfillmentProvider().prepare(quote.items[0], "pending"),
  );
  assert.throws(() => new PrintOnDemandProvider().prepare());
  c.shop.products[0].variants[0].fulfillment = "pod";
  assert.throws(() => quoteCart(c, cart, true));
});
test("catalog rejects duplicate variant IDs and fractional cent prices", () => {
  const c = structuredClone(demoContent);
  c.shop.products[1].variants[0].id = variant.id;
  assert.equal(contentSchema.safeParse(c).success, false);
  c.shop.products[1].variants[0].id =
    demoContent.shop.products[1].variants[0].id;
  c.shop.products[0].variants[0].price = 22.5;
  assert.equal(contentSchema.safeParse(c).success, false);
});
