import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { demoContent } from "../src/lib/demo";
import { quoteCart } from "../src/lib/shop/core";
import type { Order } from "../src/lib/shop/schema";
test("real PostgreSQL shop transactions enforce stock, RLS, payment ordering, refunds and admin concurrency", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; grant usage on schema auth to anon,authenticated; create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`,
    );
    await db.exec(
      await readFile(
        new URL("../supabase/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    const migration = await readFile(
      new URL("../supabase/shop.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration); // Reapplying an additive migration preserves existing records.
    const content = structuredClone(demoContent);
    content.shop.defaultFulfillment = "manual";
    content.shop.products[0].variants[0].stockMode = "limited";
    content.shop.products[0].variants[0].stock = 2;
    const variant = content.shop.products[0].variants[0].id;
    await db.query("insert into public.site_content(id,content) values(1,$1)", [
      content,
    ]);
    await db.exec("set role service_role");
    const quote = quoteCart(
      content,
      [{ variantId: variant, quantity: 2 }],
      true,
    );
    const reserve = async (key: string, version = 0) =>
      db.query<{ o: Order }>(
        "select public.reserve_print_order($1,$2,$3,$4,$5) o",
        [key, quote.items, quote.shipping, quote.total, version],
      );
    const key = "30000000-0000-4000-8000-000000000001";
    const order = (await reserve(key)).rows[0].o;
    await t.test(
      "reservation is idempotent, rejects stale catalogs and prevents overselling",
      async () => {
        assert.equal((await reserve(key)).rows[0].o.id, order.id);
        await assert.rejects(
          () => reserve("30000000-0000-4000-8000-000000000002"),
          /ausverkauft/,
        );
        await assert.rejects(
          () => reserve("30000000-0000-4000-8000-000000000003", 4),
          /Katalog/,
        );
      },
    );
    await t.test(
      "visitors cannot read orders, invoke service RPCs or edit payments",
      async () => {
        await db.exec("set role anon");
        await assert.rejects(
          () => db.query("select * from public.shop_orders"),
          /permission denied/,
        );
        await assert.rejects(() => reserve(key), /permission denied/);
        await db.exec("set role authenticated");
        assert.equal(
          (await db.query("select * from public.shop_orders")).rows.length,
          0,
        );
        await assert.rejects(
          () => db.query("update public.shop_orders set payment='paid'"),
          /permission denied/,
        );
        await assert.rejects(
          () =>
            db.query("select public.update_print_order($1,0,$2,'none','')", [
              order.id,
              order.items,
            ]),
          /berechtigt/,
        );
      },
    );
    await t.test(
      "admins cannot release pending orders or use disconnected POD",
      async () => {
        await db.exec(
          `select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',false)`,
        );
        const items = order.items.map((i) => ({ ...i, status: "shipped" }));
        await assert.rejects(
          () =>
            db.query("select public.update_print_order($1,0,$2,'none','')", [
              order.id,
              items,
            ]),
          /freigegeben/,
        );
      },
    );
    await t.test(
      "only a matching, once-processed payment releases production",
      async () => {
        await db.exec("set role service_role");
        const pay = (event: string, total: number) =>
          db.query(
            "select public.apply_print_event($1,$2,'cs_demo','paid',$3,'Demo','demo@example.invalid','Demo address','pi_demo')",
            [event, order.id, total],
          );
        await assert.rejects(
          () => pay("evt_wrong", quote.total - 100),
          /Zahlbetrag/,
        );
        await pay("evt_paid", quote.total);
        await pay("evt_paid", quote.total);
        await db.exec("reset role");
        const rows = await db.query<Order>(
          "select * from public.shop_orders where id=$1",
          [order.id],
        );
        assert.equal(rows.rows[0].payment, "paid");
        assert.equal(rows.rows[0].version, 1);
        assert.equal(rows.rows[0].items[0].status, "ready");
        await db.exec("set role service_role");
        await db.query(
          "select public.apply_print_event('evt_expired',$1,'cs_demo','failed',0,'','','','')",
          [order.id],
        );
        await db.exec("reset role");
        assert.equal(
          (
            await db.query<Order>(
              "select * from public.shop_orders where id=$1",
              [order.id],
            )
          ).rows[0].payment,
          "paid",
        );
        assert.equal(
          (await db.query("select * from public.shop_notifications")).rows
            .length,
          1,
        );
      },
    );
    await t.test(
      "admin edits preserve immutable prices and reject old revisions",
      async () => {
        await db.exec("set role authenticated");
        const changed = order.items.map((i) => ({
          ...i,
          price: 1,
          quantity: 999,
          status: "processing",
        }));
        await assert.rejects(
          () =>
            db.query("select public.update_print_order($1,0,$2,'none','')", [
              order.id,
              changed,
            ]),
          /geändert/,
        );
        const result = await db.query<{ o: Order }>(
          "select public.update_print_order($1,1,$2,'requested','Return requested') o",
          [order.id, changed],
        );
        assert.equal(result.rows[0].o.items[0].price, quote.items[0].price);
        assert.equal(result.rows[0].o.items[0].quantity, 2);
        assert.equal(result.rows[0].o.items[0].status, "processing");
        await assert.rejects(
          () =>
            db.query("select public.update_print_order($1,2,$2,'none','')", [
              order.id,
              changed.map((i) => ({ ...i, fulfillment: "pod" })),
            ]),
          /freigegeben/,
        );
      },
    );
    await t.test(
      "verified refunds are idempotent, monotonic and reduce net revenue",
      async () => {
        await db.exec("set role service_role");
        await db.query(
          "select public.apply_print_refund('evt_refund1','pi_demo',1000)",
        );
        await db.query(
          "select public.apply_print_refund('evt_refund2','pi_demo',500)",
        );
        await db.exec("set role authenticated");
        let result = await db.query<{ s: { sales: number } }>(
          "select public.print_shop_summary() s",
        );
        assert.equal(result.rows[0].s.sales, quote.total - 1000);
        await db.exec("set role service_role");
        await db.query(
          "select public.apply_print_refund('evt_refund3','pi_demo',$1)",
          [quote.total],
        );
        await db.query(
          "select public.apply_print_refund('evt_refund3','pi_demo',$1)",
          [quote.total],
        );
        await db.exec("set role authenticated");
        result = await db.query<{ s: { sales: number } }>(
          "select public.print_shop_summary() s",
        );
        assert.equal(result.rows[0].s.sales, 0);
        const orderNow = (
          await db.query<Order>(
            "select * from public.shop_orders where id=$1",
            [order.id],
          )
        ).rows[0];
        assert.equal(orderNow.payment, "refunded");
        assert.equal(orderNow.items[0].status, "cancelled");
      },
    );
  } finally {
    await db.close();
  }
});
