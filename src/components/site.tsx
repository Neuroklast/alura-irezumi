"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  X,
  Menu,
  MoveRight,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useStudio } from "./studio-provider";
import { HeroScene } from "./hero-scene";
import type { Artwork } from "@/lib/schema";
export function Header() {
  const [open, setOpen] = useState(false);
  const { demo } = useStudio();
  return (
    <>
      <a className="skip" href="#main">
        Zum Inhalt
      </a>
      <header className="header">
        <Link href="/" className="brand" aria-label="ALURA Startseite">
          ALURA<span>IREZUMI</span>
        </Link>
        <nav aria-label="Hauptnavigation" className={open ? "nav open" : "nav"}>
          <Link href="/work" onClick={() => setOpen(false)}>
            Arbeiten
          </Link>
          <Link href="/#artist" onClick={() => setOpen(false)}>
            Die Künstlerin
          </Link>
          <Link href="/contact" onClick={() => setOpen(false)}>
            Anfragen <ArrowUpRight size={14} />
          </Link>
        </nav>
        <Link className="studio-link" href="/admin">
          <span className="tiny-dot" />
          {demo ? "Demo Studio" : "Studio"}
        </Link>
        <button
          className="mobile-menu icon-button"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <Link href="/" className="brand">
        ALURA<span>IREZUMI</span>
      </Link>
      <p>Tattoo art. Mirror art. Your story.</p>
      <div>
        <Link href="/legal">Rechtliches</Link>
        <Link href="/admin">Studio</Link>
        <a
          href="https://www.instagram.com/alura.irezumi/"
          target="_blank"
          rel="noreferrer"
        >
          Instagram <ArrowUpRight size={13} />
        </a>
      </div>
      <small>© {new Date().getFullYear()} ALURA IREZUMI</small>
    </footer>
  );
}
function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7 }}
    >
      {children}
    </motion.div>
  );
}
export function Home() {
  const { content, demo } = useStudio();
  const [surface, setSurface] = useState(content.scene.surface);
  useEffect(() => setSurface(content.scene.surface), [content.scene.surface]);
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-line" /> TATTOO & MIRROR ART
            </div>
            <h1>
              Under your skin.
              <br />
              <span>Beyond the glass.</span>
            </h1>
            <p>
              Deine Geschichte. Meine Linien.
              <br />
              Kunst auf Haut und gravierten Spiegeln.
            </p>
            <div className="hero-actions">
              <Link href="/work" className="button light">
                Arbeiten entdecken <ArrowUpRight size={18} />
              </Link>
              <Link href="/contact" className="text-link">
                Deine Idee <MoveRight size={18} />
              </Link>
            </div>
            <div className="hero-footnote">
              <span>ANIME · FANTASY · LINEWORK</span>
              <span>ONE ARTIST. TWO SURFACES.</span>
            </div>
          </div>
          <div className="hero-visual">
            <HeroScene scene={{ ...content.scene, surface }} />
            <div className="material-control">
              <span>GLASS</span>
              <input
                aria-label="Materialwechsel zwischen Glas und Haut"
                type="range"
                min="0"
                max="100"
                value={surface}
                onChange={(e) => setSurface(+e.target.value)}
              />
              <span>INK</span>
            </div>
            <span className="interaction-hint">
              Verschiebe die Grenze. Entdecke das Material.
            </span>
          </div>
          <a href="#selected" className="scroll-cue">
            <ArrowDown size={16} /> SCROLL TO EXPLORE
          </a>
        </section>
        <div className="ticker" aria-hidden="true">
          <span>INK ON SKIN</span>
          <i>+</i>
          <span>LIGHT ON GLASS</span>
          <i>+</i>
          <span>ART WITHOUT LIMITS</span>
          <i>+</i>
          <span>ALURA IREZUMI</span>
        </div>
        <section id="selected" className="section selected">
          <Reveal className="section-heading">
            <div>
              <p className="eyebrow">01 / SELECTED WORK</p>
              <h2>
                Eine Idee.
                <br />
                <em>Viele Möglichkeiten.</em>
              </h2>
            </div>
            <div>
              <p>
                Von der ersten Linie bis zum letzten Detail.
                <br />
                Entdecke die Welt zwischen Tinte und Reflexion.
              </p>
              <Link href="/work" className="text-link">
                Alle Arbeiten <ArrowUpRight size={18} />
              </Link>
            </div>
          </Reveal>
          {demo && (
            <p className="demo-disclosure">
              DEMO COLLECTION / Illustrative Entwürfe. Keine Originalarbeiten
              von Laura.
            </p>
          )}
          <div className="selected-grid">
            {content.works.slice(0, 3).map((work, i) => (
              <Reveal key={work.id} className={`selected-item item-${i}`}>
                <WorkCard work={work} />
              </Reveal>
            ))}
          </div>
        </section>
        <section className="glass-section">
          <Reveal>
            <p className="eyebrow">02 / BEHIND THE GLASS</p>
            <h2>
              Manche Kunst
              <br />
              verändert den <em>Blick.</em>
            </h2>
            <p>
              Gravierte Linien fangen das Licht.
              <br />
              Der Spiegel wird zum Kunstwerk.
            </p>
            <Link href="/work?filter=mirror" className="button outline">
              Spiegel entdecken <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <div className="glass-object">
            <img
              src="/art/bloom-mirror.svg"
              alt="Illustrativer Entwurf eines floral gravierten Spiegels"
              loading="lazy"
            />
            <span className="object-caption">REFLECTION STUDY / 002</span>
          </div>
        </section>
        <section id="artist" className="section artist">
          <Reveal className="artist-art">
            <div className="artist-monogram">a.</div>
            <span>THE HAND BEHIND THE LINES</span>
            <div className="artist-stamp">
              INK
              <br />& GLASS
            </div>
          </Reveal>
          <Reveal className="artist-copy">
            <p className="eyebrow">03 / THE ARTIST</p>
            <h2>
              Hey, ich bin
              <br />
              <em>{content.artist}.</em>
            </h2>
            <p className="body-copy">{content.bio}</p>
            <a
              href={content.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Ein Blick ins Atelier <ArrowUpRight size={18} />
            </a>
          </Reveal>
        </section>
        <section className="contact-banner">
          <p className="eyebrow">LET'S MAKE IT PERSONAL</p>
          <h2>
            Deine Idee.
            <br />
            <em>Unsere nächste Linie.</em>
          </h2>
          <Link href="/contact" className="button light">
            Erzähl mir davon <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
const categoryLabels = {
  tattoo: "TATTOO ART",
  mirror: "MIRROR ART",
  motif: "FLASH DESIGN",
};
export function WorkCard({ work }: { work: Artwork }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="work-card" onClick={() => setOpen(true)}>
        <div className="work-image">
          <img src={work.image} alt={work.title} loading="lazy" />
          <span className="work-open">
            <ArrowUpRight size={20} />
          </span>
          {work.available && <span className="availability">ANFRAGBAR</span>}
        </div>
        <div className="work-caption">
          <h3>{work.title}</h3>
          <span>{categoryLabels[work.category]}</span>
        </div>
      </button>
      {open && <ArtworkDialog work={work} close={() => setOpen(false)} />}
    </>
  );
}
function ArtworkDialog({ work, close }: { work: Artwork; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="art-dialog"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <button
        autoFocus
        className="dialog-close icon-button"
        onClick={close}
        aria-label="Detailansicht schließen"
      >
        <X />
      </button>
      <img src={work.image} alt={work.title} />
      <div>
        <span className="eyebrow">{categoryLabels[work.category]}</span>
        <h2>{work.title}</h2>
        <p>{work.description}</p>
        <Link
          className="button light"
          href={`/contact?motif=${encodeURIComponent(work.title)}&type=${work.category === "mirror" ? "mirror" : "tattoo"}`}
        >
          Dieses Motiv anfragen <ArrowUpRight size={18} />
        </Link>
      </div>
    </dialog>
  );
}
export function WorkGallery() {
  const { content, demo } = useStudio();
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    const f = new URLSearchParams(location.search).get("filter");
    if (f && ["tattoo", "mirror", "motif"].includes(f)) setFilter(f);
  }, []);
  const works = content.works.filter(
    (w) => filter === "all" || w.category === filter,
  );
  return (
    <>
      <Header />
      <main id="main" className="section gallery-page">
        <p className="eyebrow">THE COLLECTION</p>
        <h1>
          Made of stories.
          <br />
          <em>Drawn in lines.</em>
        </h1>
        <div className="filter-bar" aria-label="Arbeiten filtern">
          {[
            ["all", "Alle Arbeiten"],
            ["tattoo", "Tattoos"],
            ["mirror", "Spiegel"],
            ["motif", "Flash Designs"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={filter === v}
              className={filter === v ? "active" : ""}
              onClick={() => setFilter(v)}
            >
              {l}
              <span>
                {v === "all"
                  ? content.works.length
                  : content.works.filter((w) => w.category === v).length}
              </span>
            </button>
          ))}
        </div>
        {demo && (
          <p className="demo-disclosure">
            Illustrative Demokollektion. Originalarbeiten werden im Studio
            hochgeladen.
          </p>
        )}
        <div className="gallery-grid">
          {works.map((w) => (
            <WorkCard work={w} key={w.id} />
          ))}
        </div>
        {!works.length && (
          <p className="empty-state">Hier entstehen bald neue Arbeiten.</p>
        )}
      </main>
      <Footer />
    </>
  );
}
export function Contact() {
  const { demo, content } = useStudio();
  const [kind, setKind] = useState("tattoo"),
    [sent, setSent] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [motif, setMotif] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get("type") === "mirror") setKind("mirror");
    setMotif(p.get("motif") || "");
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: kind }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json.error || "Die Anfrage konnte nicht gespeichert werden.",
        );
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verbindungsfehler.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main id="main" className="section contact-page">
        <div>
          <p className="eyebrow">LET'S CREATE SOMETHING</p>
          <h1>
            Alles beginnt
            <br />
            mit <em>deiner Idee.</em>
          </h1>
          <p className="body-copy">
            Tattoo oder Spiegelgravur? Erzähl mir, was du dir vorstellst. Die
            Details finden wir gemeinsam heraus.
          </p>
          <a
            className="text-link"
            href={content.instagram}
            target="_blank"
            rel="noreferrer"
          >
            @alura.irezumi <ArrowUpRight size={18} />
          </a>
          {demo && (
            <div className="notice">
              Demo-Modus: Das Formular wird geprüft, aber deine Anfrage wird
              weder gespeichert noch versendet.
            </div>
          )}
        </div>
        <div className="contact-form">
          {sent ? (
            <div className="success-panel" role="status">
              <Check size={40} />
              <h2>{demo ? "Demo erfolgreich." : "Anfrage eingegangen."}</h2>
              <p>
                {demo
                  ? "Es wurden keine Daten übermittelt oder gespeichert."
                  : "Deine Anfrage wurde gespeichert. Laura kann sie im Studio lesen."}
              </p>
              <button className="button outline" onClick={() => setSent(false)}>
                Weitere Anfrage
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="segmented">
                {[
                  ["tattoo", "Tattoo"],
                  ["mirror", "Spiegelgravur"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={kind === v}
                    className={kind === v ? "active" : ""}
                    onClick={() => setKind(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="form-row">
                <label>
                  Dein Name
                  <input
                    name="name"
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>
                <label>
                  E-Mail
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                  />
                </label>
              </div>
              <label>
                Motiv / Inspiration
                <input
                  name="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  maxLength={160}
                  placeholder="Was schwebt dir vor?"
                />
              </label>
              <div className="form-row">
                <label>
                  {kind === "tattoo" ? "Körperstelle" : "Spiegelform"}
                  <input
                    name="placement"
                    maxLength={160}
                    placeholder={
                      kind === "tattoo" ? "z. B. Unterarm" : "z. B. rund, oval"
                    }
                  />
                </label>
                <label>
                  Ungefähre Größe
                  <input name="size" maxLength={80} placeholder="in cm" />
                </label>
              </div>
              <label>
                Erzähl mir mehr
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={5}
                />
              </label>
              <label className="honeypot" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <label className="checkbox-label">
                <input name="consent" type="checkbox" required value="yes" />
                Ich habe die{" "}
                <Link href="/legal#privacy">Datenschutzhinweise</Link> gelesen
                und stimme der Bearbeitung meiner Anfrage zu.
              </label>
              <p className="form-error" role="alert">
                {error}
              </p>
              <button className="button light" disabled={busy}>
                {busy
                  ? "Wird geprüft…"
                  : demo
                    ? "Demo-Anfrage testen"
                    : "Anfrage senden"}
                <ArrowUpRight size={18} />
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
