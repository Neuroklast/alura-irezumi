"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Minus, Plus, X } from "lucide-react";
import { Header, Footer } from "./site";
import { useStudio } from "./studio-provider";
import { useShop } from "./shop-provider";
import { euro, type Product } from "@/lib/shop/schema";
import { quoteCart, variantLabel } from "@/lib/shop/core";
export function PrintTeaser() {
  const { content, demo } = useStudio();
  const products = content.shop.products
    .filter(
      (p) =>
        p.published &&
        p.variants.some((v) => v.active) &&
        content.works.some((w) => w.id === p.artworkId),
    )
    .slice(0, 3);
  return (
    <section id="prints" className="section print-teaser">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PRINT / KUNSTDRUCKE</p>
          <h2>Auch auf Papier.</h2>
        </div>
        <div>
          <p>
            {demo
              ? "So könnte der Print-Shop aussehen."
              : "Hier findest du meine Kunstdrucke."}
          </p>
          <Link href="/prints" className="text-link">
            Zu den Prints <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      {!!products.length && (
        <div className="print-teaser-grid">
          {products.map((p) => {
            const work = content.works.find((w) => w.id === p.artworkId)!;
            return (
              <Link
                href={`/prints#product-${p.id}`}
                className="print-teaser-item"
                key={p.id}
              >
                <div className="print-paper">
                  <img
                    src={work.image}
                    alt={`${p.title} als Print-Vorschau`}
                    width={300}
                    height={420}
                    loading="lazy"
                  />
                </div>
                <span>
                  {p.title}
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
export function PrintShop({
  enabled,
  checkoutResult,
}: {
  enabled: boolean;
  checkoutResult?: string;
}) {
  const { content, demo } = useStudio();
  const shop = useShop();
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const products = content.shop.products.filter(
    (p) =>
      p.published &&
      p.variants.some((v) => v.active) &&
      content.works.some((w) => w.id === p.artworkId),
  );
  let quote: ReturnType<typeof quoteCart> | null = null,
    cartError = "";
  if (shop.cart.length) {
    try {
      quote = quoteCart(content, shop.cart);
    } catch (e) {
      cartError =
        e instanceof Error ? e.message : "Warenkorb bitte neu zusammenstellen.";
    }
  }
  async function checkout() {
    setBusy(true);
    setMessage("");
    try {
      if (demo) {
        const order = shop.demoCheckout();
        setOrderId(order.id);
        return;
      }
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: shop.cart, key: shop.checkoutKey }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Checkout nicht verfügbar.");
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
        throw new Error("Ungültige Checkout-Adresse.");
      window.location.assign(url.href);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Bestellung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="public-site">
      <Header />
      <main id="main" className="section print-shop">
        <div className="print-shop-heading">
          <div>
            <p className="eyebrow">ALURA / KUNSTDRUCKE</p>
            <h1>Motive auf Papier.</h1>
            <p>Such dir dein Motiv und das passende Format aus.</p>
          </div>
          <a href="#cart" className="button outline">
            <ShoppingBag size={20} /> Warenkorb (
            {shop.cart.reduce((n, i) => n + i.quantity, 0)})
          </a>
        </div>
        {demo ? (
          <p className="shop-notice">
            Demo-Shop · Beispielpreise und Papierangaben. Es wird nichts
            gekauft, bezahlt oder verschickt.
          </p>
        ) : (
          !enabled && (
            <p className="shop-notice">
              Der Print-Shop ist in Vorbereitung. Echte Bestellungen sind noch
              nicht freigeschaltet.
            </p>
          )
        )}
        {checkoutResult === "success" && (
          <p className="shop-notice" role="status">
            Danke. Der Zahlungsanbieter bestätigt die Zahlung separat. Eine
            Rückkehr auf diese Seite ist noch keine Zahlungsbestätigung.
          </p>
        )}
        {checkoutResult === "cancelled" && (
          <p className="shop-notice" role="status">
            Checkout verlassen. Dein Warenkorb ist noch da.
          </p>
        )}
        {shop.storageNotice && (
          <p role="status" className="shop-notice">
            {shop.storageNotice}
          </p>
        )}
        <div className="print-grid">
          {products.map((p) => (
            <PrintCard
              product={p}
              key={p.id}
              onAdded={() => {
                setMessage(`${p.title} liegt im Warenkorb.`);
                setOrderId("");
              }}
            />
          ))}
        </div>
        {!products.length && (
          <p className="shop-empty">Die ersten Prints kommen bald.</p>
        )}
        <p className="shop-feedback" role="status">
          {message}{" "}
          {message.includes("Warenkorb.") && <a href="#cart">Zum Warenkorb</a>}
        </p>
        <section
          className="shop-cart panel"
          id="cart"
          aria-labelledby="cart-heading"
        >
          <div className="panel-heading">
            <h2 id="cart-heading">Dein Warenkorb.</h2>
            {!!shop.cart.length && (
              <button className="text-link" onClick={shop.clear}>
                Leeren
              </button>
            )}
          </div>
          {orderId && (
            <div className="shop-notice" role="status">
              <strong>Demobestellung angelegt.</strong>
              <p>
                Nr. {orderId.slice(0, 8).toUpperCase()} · Simulierte Zahlung.
              </p>
              <Link className="text-link" href="/admin?tab=orders">
                Im Atelier ansehen <ArrowUpRight size={18} />
              </Link>
            </div>
          )}
          {!shop.cart.length && !orderId && <p>Dein Warenkorb ist leer.</p>}
          {cartError && (
            <p role="alert" className="form-error">
              {cartError}
            </p>
          )}
          {shop.cart.map((line) => {
            const p = content.shop.products.find((p) =>
              p.variants.some((v) => v.id === line.variantId),
            );
            const v = p?.variants.find((v) => v.id === line.variantId);
            return (
              <div className="cart-line" key={line.variantId}>
                <div>
                  <h3>{p?.title || "Nicht mehr verfügbar"}</h3>
                  {v && <p>{variantLabel(v)}</p>}
                </div>
                <div className="cart-quantity">
                  <button
                    aria-label={`${p?.title || "Print"}: ein Exemplar weniger`}
                    onClick={() =>
                      shop.quantity(line.variantId, line.quantity - 1)
                    }
                  >
                    <Minus size={17} />
                  </button>
                  <output aria-label="Stückzahl">{line.quantity}</output>
                  <button
                    aria-label={`${p?.title || "Print"}: ein Exemplar mehr`}
                    disabled={line.quantity >= 10}
                    onClick={() =>
                      shop.quantity(line.variantId, line.quantity + 1)
                    }
                  >
                    <Plus size={17} />
                  </button>
                </div>
                <strong>{v ? euro(v.price * line.quantity) : ""}</strong>
                <button
                  aria-label={`${p?.title || "Print"} entfernen`}
                  onClick={() => shop.quantity(line.variantId, 0)}
                >
                  <X size={18} />
                </button>
              </div>
            );
          })}
          {quote && (
            <div className="cart-summary">
              <p>
                <span>Prints</span>
                <span>{euro(quote.subtotal)}</span>
              </p>
              <p>
                <span>Versand innerhalb Deutschlands</span>
                <span>{euro(quote.shipping)}</span>
              </p>
              <p className="cart-total">
                <strong>Gesamt</strong>
                <strong>{euro(quote.total)}</strong>
              </p>
              <p>
                {demo
                  ? "Alle Preise sind Demowerte."
                  : "Endpreise inklusive anfallender Steuern. Zahlung über Stripe."}
              </p>
              {content.shop.deliveryNote && <p>{content.shop.deliveryNote}</p>}
              <button
                className="button light"
                disabled={!shop.ready || busy || (!demo && !enabled)}
                onClick={checkout}
              >
                {busy
                  ? "Wird vorbereitet…"
                  : demo
                    ? "Demo-Bestellung auslösen"
                    : "Zur Zahlung"}
                <ArrowUpRight size={18} />
              </button>
              {!demo && (
                <p>
                  Lieferadresse und Zahlung gibst du im nächsten Schritt ein.{" "}
                  <Link href="/legal">Versand, Widerruf & Datenschutz</Link>
                </p>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
function PrintCard({
  product,
  onAdded,
}: {
  product: Product;
  onAdded: () => void;
}) {
  const { content, demo } = useStudio();
  const { add, ready, orders } = useShop();
  const active = product.variants.filter((v) => v.active);
  const [selected, setSelected] = useState(active[0]?.id || "");
  const [error, setError] = useState("");
  const variant = active.find((v) => v.id === selected) || active[0];
  const work = content.works.find((w) => w.id === product.artworkId)!;
  const used = demo
    ? orders
        .filter((o) => o.payment !== "failed")
        .flatMap((o) => o.items)
        .filter((i) => i.variantId === variant?.id)
        .reduce((n, i) => n + i.quantity, 0)
    : 0;
  const soldOut =
    !variant || (variant.stockMode === "limited" && variant.stock <= used);
  return (
    <article className="print-card" id={`product-${product.id}`}>
      <div className="print-paper">
        <img
          src={work.image}
          alt={`${product.title} als Print-Vorschau`}
          width={420}
          height={560}
          loading="lazy"
        />
      </div>
      <div className="print-card-body">
        <h2>{product.title}</h2>
        <p>{product.description}</p>
        <label htmlFor={`variant-${product.id}`}>Format & Papier</label>
        <select
          id={`variant-${product.id}`}
          value={variant?.id || ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          {active.map((v) => (
            <option key={v.id} value={v.id}>
              {variantLabel(v)}
            </option>
          ))}
        </select>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="print-card-buy">
          <span className="print-price">
            {variant && euro(variant.price)}
            {demo && <small>Demo-Preis</small>}
          </span>
          <button
            className="button outline"
            disabled={!ready || soldOut}
            onClick={() => {
              if (variant) {
                try {
                  add(variant.id);
                  setError("");
                  onAdded();
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Warenkorb konnte nicht geändert werden.",
                  );
                }
              }
            }}
          >
            {soldOut ? "Ausverkauft" : "In den Warenkorb"}
            <Plus size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
