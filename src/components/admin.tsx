"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  LayoutDashboard,
  ImagePlus,
  Layers,
  Settings2,
  Save,
  RotateCcw,
  Trash2,
  Plus,
  Check,
  LogOut,
  Mail,
} from "lucide-react";
import { ShopProducts, ShopOrders, ShopOrderOverview } from "./shop-admin";
import { useStudio } from "./studio-provider";
import { HeroScene } from "./hero-scene";
import { motifs, type MotifKey } from "@/lib/motifs";
import type { Artwork } from "@/lib/schema";
type Enquiry = {
  id: string;
  name: string;
  email: string;
  type: string;
  motif: string;
  placement: string;
  size: string;
  message: string;
  created_at: string;
};
export function Admin({ enquiries = [] }: { enquiries?: Enquiry[] }) {
  const { content, setContent, demo, integrations, save, reset, ready } =
    useStudio();
  const [tab, setTab] = useState("overview"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [editing, setEditing] = useState<Artwork | null>(null),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "orders")
      setTab("orders");
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update(next: typeof content) {
    setContent(next);
    setDirty(true);
    setMessage("");
  }
  async function persist() {
    setBusy(true);
    try {
      setMessage(await save());
      setDirty(false);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      throw new Error("Bitte PNG, JPEG oder WebP verwenden.");
    if (file.size > (demo ? 2 : 10) * 1024 * 1024)
      throw new Error(`Maximal ${demo ? 2 : 10} MB pro Bild.`);
    if (demo)
      return await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () =>
          reject(new Error("Bild konnte nicht gelesen werden."));
        r.readAsDataURL(file);
      });
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: file.type, size: file.size }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Upload konnte nicht vorbereitet werden.");
    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok)
      throw new Error("R2-Upload fehlgeschlagen. CORS-Konfiguration prüfen.");
    return data.publicUrl as string;
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="brand">
          ALURA<span>ATELIER</span>
        </Link>
        <span className="admin-mode">
          <span className="tiny-dot" />
          {demo ? "DEMO-ATELIER" : "LIVE-ATELIER"}
        </span>
        <nav aria-label="Atelier-Navigation">
          {[
            { id: "overview", label: "Übersicht", icon: LayoutDashboard },
            { id: "hero", label: "Startbild", icon: Settings2 },
            { id: "works", label: "Arbeiten & Motive", icon: Layers },
            { id: "enquiries", label: "Anfragen", icon: Mail },
            { id: "prints", label: "Print-Produkte", icon: Layers },
            { id: "orders", label: "Bestellungen", icon: Mail },
            { id: "settings", label: "Profil & Texte", icon: ImagePlus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/">
            Website ansehen <ArrowUpRight size={16} />
          </Link>
          {!demo && (
            <button
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                location.reload();
              }}
            >
              <LogOut size={16} />
              Abmelden
            </button>
          )}
          <p>
            HAUT & GLAS
            <br />
            INHALTE / 一
          </p>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <span className="eyebrow">ALURA / DEIN ATELIER</span>
            <h1>
              {tab === "overview"
                ? "Übersicht"
                : tab === "hero"
                  ? "Startbild"
                  : tab === "works"
                    ? "Arbeiten & Motive"
                    : tab === "enquiries"
                      ? "Anfragen"
                      : tab === "prints"
                        ? "Print-Produkte"
                        : tab === "orders"
                          ? "Bestellungen"
                          : "Profil & Texte"}
            </h1>
          </div>
          {tab !== "orders" && (
            <button
              className="button light"
              disabled={busy || !ready}
              onClick={persist}
            >
              <Save size={16} />
              {busy
                ? "Speichert…"
                : dirty
                  ? "Änderungen speichern"
                  : "Speichern"}
            </button>
          )}
        </header>
        <div className="admin-body">
          {demo && (
            <div className="demo-banner">
              <div>
                <span className="tiny-dot" />
                <strong>Du bist im Demo-Modus.</strong> Probier alles aus.
                Änderungen bleiben in diesem Browser.
              </div>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Lokale Demoänderungen und Demobilder zurücksetzen?",
                    )
                  ) {
                    reset();
                    setDirty(false);
                    setMessage("Demo zurückgesetzt.");
                  }
                }}
              >
                <RotateCcw size={14} />
                Demo zurücksetzen
              </button>
            </div>
          )}
          {message && (
            <div className="status-message" role="status">
              {message}
            </div>
          )}
          {dirty && (
            <p className="unsaved">
              Ungespeicherte Änderungen · Vorschau wird sofort aktualisiert.
            </p>
          )}
          {tab === "overview" && (
            <>
              <div className="stat-grid">
                <div>
                  <span>ARBEITEN</span>
                  <strong>
                    {content.works.length.toString().padStart(2, "0")}
                  </strong>
                  <small>in deiner Kollektion</small>
                </div>
                <div>
                  <span>MATERIALIEN</span>
                  <strong>02</strong>
                  <small>Haut & Glas</small>
                </div>
                <div>
                  <span>VERFÜGBAR</span>
                  <strong>
                    {content.works
                      .filter((w) => w.available)
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  <small>Motive zum Anfragen</small>
                </div>
              </div>
              <ShopOrderOverview onOpen={() => setTab("orders")} />
              <div className="admin-overview-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <h2>Deine aktuelle Szene</h2>
                    <button
                      className="text-link"
                      onClick={() => setTab("hero")}
                    >
                      Bearbeiten <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <HeroScene scene={content.scene} compact />
                </div>
                <div className="panel setup-panel">
                  <p className="eyebrow">DEIN ATELIER</p>
                  <h2>Deine Website.</h2>
                  <p>
                    Hier kannst du Motive und Texte bearbeiten und dein
                    Startbild einstellen.
                  </p>
                  <button
                    className="button outline"
                    onClick={() => setTab("works")}
                  >
                    Arbeit hinzufügen <Plus size={16} />
                  </button>
                  <div className="integration">
                    <span>Inhalte / Supabase</span>
                    <b>{integrations.supabase ? "Konfiguriert" : "Demo"}</b>
                  </div>
                  <div className="integration">
                    <span>Bilder / Cloudflare R2</span>
                    <b>
                      {integrations.r2 ? "Konfiguriert" : "Nicht verbunden"}
                    </b>
                  </div>
                  <small>
                    Die Anzeigen prüfen die Konfiguration, nicht die
                    Erreichbarkeit.
                  </small>
                </div>
              </div>
            </>
          )}
          {tab === "prints" && (
            <ShopProducts onChange={(shop) => update({ ...content, shop })} />
          )}
          {tab === "orders" && <ShopOrders />}
          {tab === "hero" && (
            <div className="hero-editor">
              <div className="panel">
                <div className="panel-heading">
                  <h2>Direkte Vorschau</h2>
                  <span className="eyebrow">GLAS / HAUT</span>
                </div>
                <HeroScene scene={content.scene} />
              </div>
              <div className="panel controls">
                <p className="eyebrow">SZENENEINSTELLUNGEN</p>
                <h2>Materialvorschau</h2>
                <label>
                  Motiv
                  <select
                    value={
                      content.scene.customImage
                        ? content.scene.customImage
                        : content.scene.motif
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      const builtIn = Object.keys(motifs).includes(value);
                      update({
                        ...content,
                        scene: {
                          ...content.scene,
                          ...(builtIn
                            ? {
                                motif: value as typeof content.scene.motif,
                                customImage: undefined,
                              }
                            : { customImage: value }),
                        },
                      });
                    }}
                  >
                    {Object.entries(motifs).map(([key, motif]) => (
                      <option key={key} value={key}>
                        {motif.name}
                      </option>
                    ))}
                    {content.works
                      .filter(
                        (w) =>
                          w.category === "motif" &&
                          !w.image.startsWith("/art/"),
                      )
                      .map((w) => (
                        <option key={w.id} value={w.image}>
                          Eigenes Motiv: {w.title}
                        </option>
                      ))}
                  </select>
                </label>
                <p className="muted">
                  Vektormotive stammen aus den bereitgestellten Wannado-Posts.
                  Eigene Motive kannst du unter „Arbeiten & Motive“ als
                  transparentes PNG hochladen und hier auswählen. Rastermotive
                  erscheinen per Maskenanimation.
                </p>
                {[
                  {
                    key: "surface" as const,
                    label: "Materialmischung",
                    min: 0,
                    max: 100,
                    step: 1,
                  },
                  {
                    key: "glow" as const,
                    label: "Lichtintensität",
                    min: 0,
                    max: 1,
                    step: 0.05,
                  },
                  {
                    key: "speed" as const,
                    label: "Animationsgeschwindigkeit",
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                  },
                ].map((c) => (
                  <label key={c.key}>
                    {c.label}
                    <output>{content.scene[c.key]}</output>
                    <input
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={content.scene[c.key]}
                      onChange={(e) =>
                        update({
                          ...content,
                          scene: { ...content.scene, [c.key]: +e.target.value },
                        })
                      }
                    />
                  </label>
                ))}
                <p className="muted">
                  Der Materialwechsel zeigt eine Illustration. Echte
                  Portfolioaufnahmen bleiben unverändert.
                </p>
              </div>
            </div>
          )}
          {tab === "works" && (
            <>
              <div className="panel-heading">
                <p>
                  {content.works.length} Arbeiten · Reihenfolge per Pfeiltasten
                  ändern
                </p>
                <button
                  className="button light"
                  onClick={() => {
                    setEditing({
                      id: crypto.randomUUID(),
                      title: "",
                      category: "motif",
                      image: "/art/mew.svg",
                      description: "",
                      available: true,
                    });
                  }}
                >
                  <Plus size={16} />
                  Neue Arbeit
                </button>
              </div>
              <div className="admin-works">
                {content.works.map((w, i) => (
                  <article className="admin-work" key={w.id}>
                    <img src={w.image} alt={w.title} />
                    <div>
                      <span className="eyebrow">
                        {
                          {
                            tattoo: "Tätowierung",
                            mirror: "Spiegel",
                            motif: "Motiv",
                          }[w.category]
                        }
                      </span>
                      <h3>{w.title}</h3>
                      <p>{w.available ? "Anfragbar" : "Portfolio"}</p>
                      <button
                        className="text-link"
                        onClick={() => setEditing(w)}
                      >
                        Bearbeiten <ArrowUpRight size={14} />
                      </button>
                      <div className="work-tools">
                        <button
                          disabled={i === 0}
                          aria-label={`${w.title} nach vorn`}
                          onClick={() => {
                            const works = [...content.works];
                            [works[i - 1], works[i]] = [works[i], works[i - 1]];
                            update({ ...content, works });
                          }}
                        >
                          ↑
                        </button>
                        <button
                          disabled={i === content.works.length - 1}
                          aria-label={`${w.title} nach hinten`}
                          onClick={() => {
                            const works = [...content.works];
                            [works[i + 1], works[i]] = [works[i], works[i + 1]];
                            update({ ...content, works });
                          }}
                        >
                          ↓
                        </button>
                        <button
                          aria-label={`${w.title} löschen`}
                          onClick={() => {
                            if (confirm(`„${w.title}“ löschen?`))
                              update({
                                ...content,
                                works: content.works.filter(
                                  (x) => x.id !== w.id,
                                ),
                              });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "settings" && (
            <div className="panel settings-form">
              <h2>Über dich.</h2>
              <label>
                Name
                <input
                  maxLength={80}
                  value={content.artist}
                  onChange={(e) =>
                    update({ ...content, artist: e.target.value })
                  }
                />
              </label>
              <label>
                Über dich
                <textarea
                  rows={7}
                  maxLength={2000}
                  value={content.bio}
                  onChange={(e) => update({ ...content, bio: e.target.value })}
                />
              </label>
              <label>
                Instagram
                <input
                  type="url"
                  value={content.instagram}
                  onChange={(e) =>
                    update({ ...content, instagram: e.target.value })
                  }
                />
              </label>
            </div>
          )}
          {tab === "enquiries" && (
            <div className="panel">
              <h2>Deine Anfragen</h2>
              {enquiries.length === 0 ? (
                <div className="empty-state">
                  <Mail size={30} />
                  <p>
                    {demo
                      ? "Demo-Anfragen werden nicht gespeichert."
                      : "Noch keine Anfragen vorhanden."}
                  </p>
                </div>
              ) : (
                enquiries.map((e) => (
                  <article key={e.id} className="enquiry">
                    <p className="eyebrow">
                      {e.type === "mirror" ? "Spiegelgravur" : "Tätowierung"} /{" "}
                      {new Date(e.created_at).toLocaleDateString("de-DE")}
                    </p>
                    <h3>{e.name}</h3>
                    <a href={`mailto:${e.email}`}>{e.email}</a>
                    <p>
                      {e.motif} · {e.placement} · {e.size}
                    </p>
                    <p className="preserve-lines">{e.message}</p>
                  </article>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {editing && (
        <EditDialog close={() => setEditing(null)}>
          <h2 id="edit-title">Arbeit bearbeiten</h2>
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({
                ...content,
                works: content.works.some((w) => w.id === editing.id)
                  ? content.works.map((w) =>
                      w.id === editing.id ? editing : w,
                    )
                  : [...content.works, editing],
              });
              setEditing(null);
            }}
          >
            <label>
              Titel
              <input
                autoFocus
                required
                maxLength={80}
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <label>
              Bereich
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    category: e.target.value as Artwork["category"],
                  })
                }
              >
                <option value="tattoo">Tätowierung</option>
                <option value="mirror">Spiegel</option>
                <option value="motif">Freies Motiv</option>
              </select>
            </label>
            <img
              className="edit-preview"
              src={editing.image}
              alt="Bildvorschau"
            />
            <label>
              Bild hochladen (PNG, JPEG, WebP)
              <input
                disabled={uploading || (!demo && !integrations.r2)}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const image = await upload(file);
                    setEditing((current) =>
                      current ? { ...current, image } : null,
                    );
                  } catch (err) {
                    setMessage(
                      err instanceof Error
                        ? err.message
                        : "Upload fehlgeschlagen.",
                    );
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
            {!demo && !integrations.r2 && (
              <p className="notice">Für Live-Uploads bitte R2 verbinden.</p>
            )}
            <label>
              Beschreibung
              <textarea
                maxLength={600}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editing.available}
                onChange={(e) =>
                  setEditing({ ...editing, available: e.target.checked })
                }
              />
              Anfragbar
            </label>
            <div className="form-row">
              <button
                type="button"
                className="button outline"
                onClick={() => setEditing(null)}
              >
                Abbrechen
              </button>
              <button className="button light" disabled={uploading}>
                <Check size={16} />
                Übernehmen
              </button>
            </div>
          </form>
        </EditDialog>
      )}
    </div>
  );
}
export function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="login-page">
      <Link className="brand" href="/">
        ALURA<span>ATELIER</span>
      </Link>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                Object.fromEntries(new FormData(e.currentTarget)),
              ),
            });
            if (!res.ok)
              throw new Error(
                "Anmeldung fehlgeschlagen. Zugangsdaten und Admin-Rolle prüfen.",
              );
            location.reload();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Verbindungsfehler.");
            setBusy(false);
          }
        }}
      >
        <h1>Willkommen im Atelier.</h1>
        <label>
          E-Mail
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Passwort
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <p role="alert">{error}</p>
        <button className="button light" disabled={busy}>
          {busy ? "Anmeldung…" : "Anmelden"}
          <ArrowUpRight size={16} />
        </button>
      </form>
    </main>
  );
}

function EditDialog({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      className="panel edit-panel"
      aria-labelledby="edit-title"
      ref={ref}
      onCancel={close}
    >
      {children}
    </dialog>
  );
}
