"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, ArrowUpRight, Save, RefreshCw, Package } from "lucide-react";
import { useStudio } from "./studio-provider";
import { useShop } from "./shop-provider";
import {
  productSchema,
  orderSchema,
  euro,
  fulfillmentLabels,
  paymentLabels,
  itemStatusLabels,
  type Product,
  type Variant,
  type Shop,
  type Order,
} from "@/lib/shop/schema";
import { variantLabel } from "@/lib/shop/core";
export function ShopProducts({ onChange }: { onChange: (shop: Shop) => void }) {
  const { content, demo } = useStudio();
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="shop-admin">
      <div className="panel-heading">
        <p>Prints nutzen Bilder aus „Arbeiten & Motive“.</p>
        <Link className="text-link" href="/prints">
          Shop ansehen <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="panel shop-settings">
        <h2>Versand & Shop</h2>
        <div className="shop-form-grid">
          <label>
            Standard-Versandmodell
            <select
              value={content.shop.defaultFulfillment}
              onChange={(e) =>
                onChange({
                  ...content.shop,
                  defaultFulfillment: e.target
                    .value as Shop["defaultFulfillment"],
                })
              }
            >
              {Object.entries(fulfillmentLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <MoneyInput
            label="Versandkosten Deutschland (€)"
            value={content.shop.shipping}
            onChange={(shipping) => onChange({ ...content.shop, shipping })}
          />
        </div>
        <label>
          Lieferzeit & Versandhinweis
          <textarea
            maxLength={300}
            rows={2}
            value={content.shop.deliveryNote}
            onChange={(e) =>
              onChange({ ...content.shop, deliveryNote: e.target.value })
            }
          />
        </label>
        <p className="muted">
          Einzelne Varianten können eine andere Versandart bekommen.
          Print-on-Demand bleibt bis zur Anbieteranbindung gesperrt.{" "}
          {demo
            ? "Preise, Papier und Produkte sind Demobeispiele."
            : "Echte Bestellungen müssen zusätzlich auf dem Server freigeschaltet werden."}
        </p>
      </div>
      <div className="panel-heading">
        <h2>Produkte ({content.shop.products.length})</h2>
        <button
          className="button light"
          disabled={!content.works.length || content.shop.products.length >= 60}
          onClick={() => {
            setEditing({
              id: crypto.randomUUID(),
              artworkId: content.works[0].id,
              title: content.works[0].title,
              description: "",
              published: false,
              variants: [newVariant()],
            });
            setError("");
          }}
        >
          <Plus size={17} /> Print anlegen
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {editing ? (
        <ProductEditor
          key={editing.id}
          initial={editing}
          close={() => setEditing(null)}
          save={(product) => {
            onChange({
              ...content.shop,
              products: content.shop.products.some((p) => p.id === product.id)
                ? content.shop.products.map((p) =>
                    p.id === product.id ? product : p,
                  )
                : [...content.shop.products, product],
            });
            setEditing(null);
          }}
        />
      ) : (
        <div className="shop-product-list">
          {content.shop.products.map((product) => {
            const work = content.works.find((w) => w.id === product.artworkId);
            return (
              <article className="panel shop-product-row" key={product.id}>
                {work && (
                  <div className="print-paper">
                    <img src={work.image} alt="" width={70} height={95} />
                  </div>
                )}
                <div>
                  <h3>{product.title}</h3>
                  <p>
                    {product.published ? "Sichtbar" : "Entwurf"} ·{" "}
                    {product.variants.length} Varianten
                    {!work && " · Motiv fehlt"}
                  </p>
                  <p>
                    {product.variants
                      .map((v) => `${v.format}: ${euro(v.price)}`)
                      .join(" / ")}
                  </p>
                </div>
                <button
                  className="button outline"
                  onClick={() => setEditing(product)}
                >
                  Bearbeiten
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
function newVariant(): Variant {
  return {
    id: crypto.randomUUID(),
    format: "A4",
    paper: "Mattes Kunstdruckpapier",
    edition: "",
    price: 2200,
    stockMode: "on_demand",
    stock: 0,
    fulfillment: "inherit",
    active: true,
  };
}
function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value / 100));
  useEffect(() => {
    if (Number(text.replace(",", ".")) * 100 !== value)
      setText(String(value / 100));
  }, [value]);
  return (
    <label>
      {label}
      <input
        type="text"
        inputMode="decimal"
        required
        pattern="[0-9]+([.,][0-9]{1,2})?"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value.replace(",", "."));
          if (Number.isFinite(n)) onChange(Math.round(n * 100));
        }}
      />
    </label>
  );
}
function ProductEditor({
  initial,
  save,
  close,
}: {
  initial: Product;
  save: (value: Product) => void;
  close: () => void;
}) {
  const { content } = useStudio();
  const [draft, setDraft] = useState(initial),
    [error, setError] = useState("");
  function variant(id: string, changes: Partial<Variant>) {
    setDraft({
      ...draft,
      variants: draft.variants.map((v) =>
        v.id === id ? { ...v, ...changes } : v,
      ),
    });
  }
  return (
    <form
      className="panel shop-product-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = productSchema.safeParse(draft);
        if (!parsed.success) {
          setError(
            "Bitte Titel, Motiv und alle Varianten prüfen. Preis mindestens 1 €, maximal 10.000 €.",
          );
          return;
        }
        if (!content.works.some((w) => w.id === draft.artworkId)) {
          setError("Bitte ein vorhandenes Motiv auswählen.");
          return;
        }
        save(parsed.data);
      }}
    >
      <h2>Print bearbeiten</h2>
      <div className="shop-form-grid">
        <label>
          Titel
          <input
            required
            maxLength={100}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label>
          Motiv aus dem Archiv
          <select
            value={draft.artworkId}
            onChange={(e) => setDraft({ ...draft, artworkId: e.target.value })}
          >
            {content.works.map((w) => (
              <option value={w.id} key={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Beschreibung
        <textarea
          rows={3}
          maxLength={1500}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
        />{" "}
        Im Shop anzeigen
      </label>
      <h3>Formate & Varianten</h3>
      {draft.variants.map((v, n) => (
        <fieldset key={v.id} className="shop-variant">
          <legend>Variante {n + 1}</legend>
          <div className="shop-form-grid">
            <label>
              Format
              <input
                required
                maxLength={40}
                value={v.format}
                onChange={(e) => variant(v.id, { format: e.target.value })}
              />
            </label>
            <label>
              Papier
              <input
                required
                maxLength={80}
                value={v.paper}
                onChange={(e) => variant(v.id, { paper: e.target.value })}
              />
            </label>
            <label>
              Edition
              <input
                maxLength={80}
                value={v.edition}
                onChange={(e) => variant(v.id, { edition: e.target.value })}
              />
            </label>
            <MoneyInput
              label="Endpreis (€)"
              value={v.price}
              onChange={(price) => variant(v.id, { price })}
            />
            <label>
              Bestand
              <select
                value={v.stockMode}
                onChange={(e) =>
                  variant(v.id, {
                    stockMode: e.target.value as Variant["stockMode"],
                  })
                }
              >
                <option value="unlimited">Unbegrenzt</option>
                <option value="limited">Begrenzt</option>
                <option value="on_demand">Auf Bestellung</option>
              </select>
            </label>
            {v.stockMode === "limited" && (
              <label>
                Gesamtauflage
                <input
                  type="number"
                  min={0}
                  max={100000}
                  required
                  value={v.stock}
                  onChange={(e) =>
                    variant(v.id, { stock: Number(e.target.value) })
                  }
                />
                <small>
                  Bereits verkaufte und reservierte Exemplare werden abgezogen.
                </small>
              </label>
            )}
            <label>
              Versandmodell
              <select
                value={v.fulfillment}
                onChange={(e) =>
                  variant(v.id, {
                    fulfillment: e.target.value as Variant["fulfillment"],
                  })
                }
              >
                <option value="inherit">Shop-Standard</option>
                {Object.entries(fulfillmentLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={v.active}
              onChange={(e) => variant(v.id, { active: e.target.checked })}
            />{" "}
            Variante anbieten
          </label>
          {draft.variants.length > 1 && (
            <button
              type="button"
              className="text-link"
              onClick={() =>
                setDraft({
                  ...draft,
                  variants: draft.variants.filter((x) => x.id !== v.id),
                })
              }
            >
              Variante entfernen
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        className="button outline"
        disabled={draft.variants.length >= 24}
        onClick={() =>
          setDraft({ ...draft, variants: [...draft.variants, newVariant()] })
        }
      >
        <Plus size={16} /> Variante hinzufügen
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-row">
        <button type="button" className="button outline" onClick={close}>
          Abbrechen
        </button>
        <button className="button light">
          <Save size={16} /> Übernehmen
        </button>
      </div>
      <p className="muted">
        Mit „Übernehmen“ änderst du die Vorschau. Danach oben speichern.
      </p>
    </form>
  );
}
type Notice = {
  id: string;
  order_id: string;
  kind: string;
  error: string;
  sent_at: string | null;
};
type Summary = {
  orders: number;
  pending: number;
  sales: number;
  sold: number;
  popular: { title: string; quantity: number }[];
};
export function ShopOrders() {
  const { demo } = useStudio();
  const local = useShop();
  const [orders, setOrders] = useState<Order[]>([]),
    [notices, setNotices] = useState<Notice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null),
    [mail, setMail] = useState(false);
  const [page, setPage] = useState(0),
    [total, setTotal] = useState(0),
    [revision, setRevision] = useState(0);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(!demo),
    [saving, setSaving] = useState(false),
    [selected, setSelected] = useState<Order | null>(null);
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/shop/orders?page=${page}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (cancelled) return;
        setOrders(orderSchema.array().parse(data.orders));
        setNotices(data.notifications);
        setTotal(data.total);
        setSummary(data.summary);
        setMail(data.mailConfigured);
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Bestellungen nicht verfügbar.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [demo, page, revision]);
  const source = demo ? local.orders : orders;
  const displayed = demo ? source.slice(page * 20, page * 20 + 20) : source;
  const paid = source.filter(
    (o) => o.payment === "paid" || o.payment === "partially_refunded",
  );
  const stats = demo
    ? {
        orders: source.length,
        pending: source.filter((o) => o.payment === "pending").length,
        sales: paid.reduce((n, o) => n + o.total, 0),
        sold: paid.flatMap((o) => o.items).reduce((n, i) => n + i.quantity, 0),
        popular: [],
      }
    : summary;
  async function saveOrder(order: Order) {
    setSaving(true);
    setError("");
    try {
      if (
        order.items.some(
          (i) =>
            ["ready", "processing", "shipped"].includes(i.status) &&
            (order.payment !== "paid" || i.fulfillment !== "manual"),
        )
      )
        throw new Error(
          "Versand erst nach bestätigter Zahlung und eingerichtetem Selbstversand.",
        );
      if (demo) local.updateDemo({ ...order, version: order.version + 1 });
      else {
        const res = await fetch("/api/shop/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOrders(
          orders.map((o) =>
            o.id === order.id ? orderSchema.parse(data.order) : o,
          ),
        );
      }
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="shop-admin">
      <div className="panel-heading">
        <p>
          {demo
            ? "Demobestellungen aus diesem Browser. Keine echten Käufe."
            : "Zahlungen werden vom Zahlungsanbieter bestätigt."}
        </p>
        <button
          className="button outline"
          disabled={loading}
          onClick={() => setRevision(revision + 1)}
        >
          <RefreshCw size={16} /> Neu laden
        </button>
      </div>
      {stats && (
        <div className="stat-grid">
          <div>
            <span>BESTELLUNGEN</span>
            <strong>{stats.orders}</strong>
            <small>{stats.pending} Zahlung offen</small>
          </div>
          <div>
            <span>{demo ? "DEMO-UMSATZ" : "BEZAHLT, NACH ERSTATTUNGEN"}</span>
            <strong>{euro(stats.sales)}</strong>
            <small>inklusive Versand</small>
          </div>
          <div>
            <span>VERKAUFTE PRINTS</span>
            <strong>{stats.sold}</strong>
            <small>ohne vollständig erstattete Bestellungen</small>
          </div>
        </div>
      )}
      {stats && !!stats.popular?.length && (
        <div className="panel">
          <h2>Beliebte Motive</h2>
          {stats.popular.map((p) => (
            <p key={p.title}>
              {p.title} · {p.quantity} Stück
            </p>
          ))}
        </div>
      )}
      <div className="panel shop-notifications">
        <h2>Benachrichtigungen</h2>
        <p>
          {demo
            ? `${source.length} Demobestellungen angelegt. E-Mails werden in der Demo nicht versendet.`
            : mail
              ? `${notices.length} Benachrichtigungen noch nicht als versendet bestätigt.`
              : "E-Mail-Versand noch nicht angeschlossen. Neue Bestellungen bleiben hier sichtbar."}
        </p>
        {notices.map((n) => (
          <p key={n.id}>
            {n.order_id.slice(0, 8).toUpperCase()} ·{" "}
            {n.kind === "paid"
              ? "Neue Zahlung"
              : n.kind === "refund"
                ? "Erstattung"
                : "Zahlungsproblem"}
            {n.error && ` · ${n.error}`}
          </p>
        ))}
        {!demo && mail && !!notices.length && (
          <button
            className="button outline"
            onClick={async () => {
              const res = await fetch("/api/shop/orders", { method: "POST" });
              if (!res.ok) {
                setError("Versand konnte nicht gestartet werden.");
                return;
              }
              setError("Mailversand gestartet. Zum Prüfen gleich neu laden.");
            }}
          >
            E-Mail-Versand erneut anstoßen
          </button>
        )}
      </div>
      {local.storageNotice && demo && (
        <p role="status">{local.storageNotice}</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Bestellungen werden geladen…</p>
      ) : !error && !source.length ? (
        <div className="panel shop-empty">
          <Package size={30} />
          <h2>Noch keine Bestellungen.</h2>
          {demo && (
            <Link href="/prints" className="text-link">
              Eine Demo-Bestellung ausprobieren <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      ) : (
        <div className="shop-order-list">
          {displayed.map((order) => (
            <button
              className="panel shop-order-row"
              key={order.id}
              onClick={() => {
                setSelected(order);
                setError("");
              }}
            >
              <span>
                <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                <span>
                  {new Date(order.created_at).toLocaleDateString("de-DE")} ·{" "}
                  {order.customer || "Checkout offen"}
                </span>
              </span>
              <span>
                {order.items.reduce((n, i) => n + i.quantity, 0)} Prints
              </span>
              <span className="shop-badge">{paymentLabels[order.payment]}</span>
              <strong>{euro(order.total)}</strong>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      )}
      {(demo ? source.length : total) > 20 && (
        <div className="form-row">
          <button
            className="button outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Zurück
          </button>
          <span>Seite {page + 1}</span>
          <button
            className="button outline"
            disabled={(page + 1) * 20 >= (demo ? source.length : total)}
            onClick={() => setPage(page + 1)}
          >
            Weiter
          </button>
        </div>
      )}
      {demo && !!source.length && (
        <button
          className="text-link"
          onClick={() => {
            if (confirm("Alle Demobestellungen in diesem Browser löschen?")) {
              local.resetDemo();
              setSelected(null);
              setPage(0);
            }
          }}
        >
          Demobestellungen zurücksetzen
        </button>
      )}
      {selected && (
        <OrderEditor
          key={selected.id}
          order={selected}
          save={saveOrder}
          close={() => setSelected(null)}
          busy={saving}
          demo={demo}
          error={error}
        />
      )}
    </div>
  );
}
function OrderEditor({
  order,
  save,
  close,
  busy,
  demo,
  error,
}: {
  order: Order;
  save: (o: Order) => Promise<void>;
  close: () => void;
  busy: boolean;
  demo: boolean;
  error: string;
}) {
  const [draft, setDraft] = useState(order);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="panel shop-order-editor"
      aria-labelledby="order-title"
      onCancel={close}
    >
      <div className="panel-heading">
        <h2 id="order-title">
          Bestellung #{order.id.slice(0, 8).toUpperCase()}
        </h2>
        <button className="button outline" onClick={close}>
          Schließen
        </button>
      </div>
      <p>
        {paymentLabels[order.payment]} · {euro(order.total)}
      </p>
      <div className="shop-form-grid">
        <div>
          <h3>Lieferadresse</h3>
          <p className="preserve-lines">
            {order.customer}
            <br />
            {order.address || "Noch nicht angegeben"}
          </p>
          <p>{order.email}</p>
        </div>
        <div>
          <h3>Zahlung & Erstattungen</h3>
          <p>
            {demo
              ? "Die Zahlung ist simuliert."
              : "Ein Versandstopp löst keine Erstattung aus. Nur der Zahlungsanbieter ändert den Zahlungsstatus. Erstattungen werden nach dessen Bestätigung übernommen."}
          </p>
          {!demo && order.payment_intent?.startsWith("pi_") && (
            <a
              className="text-link"
              href={`https://dashboard.stripe.com/payments/${encodeURIComponent(order.payment_intent)}`}
              target="_blank"
              rel="noreferrer"
            >
              Zahlung in Stripe öffnen <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </div>
      {draft.items.map((i, n) => (
        <fieldset className="shop-variant" key={i.variantId}>
          <legend>
            {i.quantity} × {i.title}
          </legend>
          <p>
            {i.label} · {euro(i.price * i.quantity)}
          </p>
          <div className="shop-form-grid">
            <label>
              Versandmodell
              <select
                value={i.fulfillment}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    items: draft.items.map((x, j) =>
                      j === n
                        ? {
                            ...x,
                            fulfillment: e.target.value as typeof x.fulfillment,
                            status: "blocked",
                          }
                        : x,
                    ),
                  })
                }
              >
                {Object.entries(fulfillmentLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bearbeitung
              <select
                value={i.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    items: draft.items.map((x, j) =>
                      j === n
                        ? { ...x, status: e.target.value as typeof x.status }
                        : x,
                    ),
                  })
                }
              >
                {Object.entries(itemStatusLabels).map(([key, label]) => (
                  <option
                    key={key}
                    value={key}
                    disabled={
                      ["ready", "processing", "shipped"].includes(key) &&
                      (order.payment !== "paid" || i.fulfillment !== "manual")
                    }
                  >
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sendungsnummer
              <input
                maxLength={120}
                value={i.tracking}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    items: draft.items.map((x, j) =>
                      j === n ? { ...x, tracking: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
          </div>
          {i.fulfillment === "pod" && (
            <p>Kein Anbieter verbunden. Es wird keine Produktion ausgelöst.</p>
          )}
        </fieldset>
      ))}
      <div className="shop-form-grid">
        <label>
          Retoure
          <select
            value={draft.return_status}
            onChange={(e) =>
              setDraft({
                ...draft,
                return_status: e.target.value as Order["return_status"],
              })
            }
          >
            <option value="none">Keine</option>
            <option value="requested">Angefragt</option>
            <option value="received">Eingegangen</option>
            <option value="closed">Abgeschlossen</option>
          </select>
        </label>
        <label>
          Interne Notiz
          <textarea
            rows={3}
            maxLength={2000}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        className="button light"
        disabled={busy}
        onClick={() => save(draft)}
      >
        <Save size={17} />
        {busy ? "Speichert…" : "Bestellung speichern"}
      </button>
    </dialog>
  );
}

export function ShopOrderOverview({ onOpen }: { onOpen: () => void }) {
  const { demo } = useStudio();
  const { orders } = useShop();
  const [count, setCount] = useState<number | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    fetch("/api/shop/orders?page=0", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!cancelled) setCount(data.total);
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Shop-Daten nicht verfügbar.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [demo]);
  return (
    <div className="panel shop-overview">
      <div className="panel-heading">
        <div>
          <h2>Print-Bestellungen</h2>
          <p>
            {error ||
              (demo
                ? `${orders.length} Demobestellungen in diesem Browser.`
                : count === null
                  ? "Bestellungen werden geladen…"
                  : `${count} Bestellungen im Shop.`)}
          </p>
        </div>
        <button className="button outline" onClick={onOpen}>
          Bestellungen ansehen <ArrowUpRight size={17} />
        </button>
      </div>
    </div>
  );
}
