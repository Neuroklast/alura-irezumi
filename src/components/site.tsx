"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  X,
  MoveRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useStudio } from "./studio-provider";
import { HeroScene } from "./hero-scene";
import { LineSidebar } from "./line-sidebar";
import { ReflectiveWork } from "./reflective-work";
import { motifs, type MotifKey } from "@/lib/motifs";
import type { Artwork } from "@/lib/schema";
export function Header() {
  const { demo } = useStudio();
  return (
    <>
      <a className="skip" href="#main">
        Zum Inhalt
      </a>
      <header className="header">
        <Link href="/" className="brand" aria-label="ALURA Startseite">
          <img
            src="/brand/alura-wordmark.svg"
            alt="ALURA IREZUMI"
            width="180"
            height="88"
          />
        </Link>
        <span className="header-caption">
          TÄTOWIERUNGEN
          <br />
          SPIEGELGRAVUREN
        </span>
        <div className="header-actions">
          <Link className="studio-link" href="/admin">
            <span className="tiny-dot" />
            {demo ? "Demo-Atelier" : "Atelier"}
          </Link>
          <Link className="header-contact" href="/contact">
            Deine Idee
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <LineSidebar />
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <Link href="/" className="brand">
        <img
          src="/brand/alura-wordmark.svg"
          alt="ALURA IREZUMI"
          width="180"
          height="88"
        />
      </Link>
      <p>Tattoos & Spiegelgravuren · Bochum</p>
      <div>
        <Link href="/legal">Rechtliches</Link>
        <Link href="/admin">Atelier</Link>
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
  const { content } = useStudio();
  const reduced = useReducedMotion();
  const [motif, setMotif] = useState<MotifKey>(content.scene.motif);
  useEffect(() => setMotif(content.scene.motif), [content.scene.motif]);
  const scene = {
    ...content.scene,
    motif,
    customImage:
      motif === content.scene.motif ? content.scene.customImage : undefined,
  };
  return (
    <div className="public-site">
      <Header />
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">LAURA / NEO TOKYO BOCHUM</p>
            <h1>
              ALURA
              <br />
              <span>IREZUMI</span>
            </h1>
            <p className="hero-services">Tattoos & Spiegelgravuren.</p>
            <div className="hero-actions">
              <Link href="/work" className="text-link">
                Motive ansehen
                <ArrowUpRight size={17} />
              </Link>
              <Link href="/contact" className="text-link">
                Anfrage schicken
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <HeroScene
              scene={scene}
              interactive
              motifPicker={
                <div className="scene-motif-picker">
                  <select
                    aria-label="Motiv auswählen"
                    value={motif}
                    onChange={(event) =>
                      setMotif(event.target.value as MotifKey)
                    }
                  >
                    {Object.entries(motifs).map(([key, entry]) => (
                      <option key={key} value={key}>
                        {entry.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </div>
              }
            />
          </div>
          <Link href="#selected" scroll={!!reduced} className="scroll-cue">
            <ArrowDown size={15} />
            MOTIVE ANSEHEN
          </Link>
        </section>
        <section id="selected" className="section selected">
          <Reveal className="section-heading">
            <div>
              <p className="eyebrow">一 / MOTIVE</p>
              <h2>Wannados.</h2>
            </div>
            <div>
              <p>
                Ein paar meiner Entwürfe.
                <br />
                Frag gern nach, ob dein Wunschmotiv noch frei ist.
              </p>
              <Link href="/work" className="text-link">
                Alle Motive
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </Reveal>
          <div className="selected-grid">
            {content.works.slice(0, 4).map((work, i) => (
              <Reveal key={work.id} className={`selected-item item-${i}`}>
                <WorkCard work={work} />
              </Reveal>
            ))}
          </div>
        </section>
        <section id="glass" className="glass-section">
          <Reveal>
            <p className="eyebrow">二 / SPIEGEL</p>
            <h2>Spiegelgravuren.</h2>
            <p>
              Du möchtest ein Motiv auf einem Spiegel?
              <br />
              Schreib mir, was du dir vorstellst und wie groß der Spiegel werden
              soll.
            </p>
            <Link href="/contact?type=mirror" className="text-link">
              Spiegel anfragen
              <ArrowUpRight size={17} />
            </Link>
          </Reveal>
          <ReflectiveWork className="mirror-preview">
            <img
              src={scene.customImage || motifs[motif].engravingImage}
              alt={`${motifs[motif].name} als Gravurvorschau`}
              loading="lazy"
            />
            <span className="object-caption">
              Vorschau · keine ausgeführte Gravur
            </span>
          </ReflectiveWork>
        </section>
        <section id="artist" className="section artist">
          <Reveal className="artist-art">
            <img
              src="/art/laura-atelier.webp"
              alt="Laura im NEO TOKYO Atelier in Bochum"
              loading="lazy"
            />
            <span>LAURA / NEO TOKYO BOCHUM</span>
          </Reveal>
          <Reveal className="artist-copy">
            <p className="eyebrow">三 / LAURA</p>
            <h2>Hi, ich bin Laura.</h2>
            <p className="body-copy">{content.bio}</p>
            <a
              href={content.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Mehr auf Instagram
              <ArrowUpRight size={17} />
            </a>
          </Reveal>
        </section>
        <section id="booking" className="contact-banner">
          <p className="eyebrow">四 / KONTAKT</p>
          <h2>Du hast eine Idee?</h2>
          <p>
            Schick mir dein Wunschmotiv, die ungefähre Größe
            <br />
            und bei Tattoos auch die Körperstelle.
          </p>
          <Link href="/contact" className="button light">
            Anfrage schicken
            <ArrowUpRight size={17} />
          </Link>
          <a className="contact-email" href="mailto:alura.irezumi@gmail.com">
            alura.irezumi@gmail.com
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
const categoryLabels = {
  tattoo: "TÄTOWIERUNG",
  mirror: "SPIEGELGRAVUR",
  motif: "WANNADO",
};
export function WorkCard({ work }: { work: Artwork }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="work-card" onClick={() => setOpen(true)}>
        {work.category === "mirror" ? (
          <ReflectiveWork className="work-image">
            <img src={work.image} alt={work.title} loading="lazy" />
            <span className="work-open">
              <ArrowUpRight size={20} />
            </span>
            {work.available && <span className="availability">ANFRAGBAR</span>}
          </ReflectiveWork>
        ) : (
          <div className="work-image">
            <img src={work.image} alt={work.title} loading="lazy" />
            <span className="work-open">
              <ArrowUpRight size={20} />
            </span>
            {work.available && <span className="availability">ANFRAGBAR</span>}
          </div>
        )}
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
      aria-label={work.title}
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
    <div className="public-site">
      <Header />
      <main id="main" className="section gallery-page">
        <p className="eyebrow">MOTIVE VON LAURA</p>
        <h1>Wannados & Arbeiten.</h1>
        <div className="filter-bar" aria-label="Arbeiten filtern">
          {[
            ["all", "Alle Arbeiten"],
            ["tattoo", "Tattoos"],
            ["mirror", "Spiegel"],
            ["motif", "Wannados"],
          ]
            .filter(
              ([v]) =>
                v === "all" || content.works.some((w) => w.category === v),
            )
            .map(([v, l]) => (
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
            Die Motive sind Entwürfe. Bitte frag nach, ob sie noch frei sind.
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
    </div>
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
    <div className="public-site">
      <Header />
      <main id="main" className="section contact-page">
        <div>
          <p className="eyebrow">ANFRAGE</p>
          <h1>Schreib mir.</h1>
          <p className="body-copy">
            Schick mir dein Wunschmotiv, die ungefähre Größe und bei Tattoos
            auch die Körperstelle. Wenn du Referenzbilder hast, schick sie mir
            gern per Mail.
          </p>
          <a
            className="text-link"
            href={content.instagram}
            target="_blank"
            rel="noreferrer"
          >
            @alura.irezumi <ArrowUpRight size={18} />
          </a>
          <a className="contact-email" href="mailto:alura.irezumi@gmail.com">
            alura.irezumi@gmail.com
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
                  ? "Deine Eingaben wurden geprüft, aber weder gespeichert noch an Laura versendet."
                  : "Deine Anfrage wurde gespeichert. Laura kann sie im Atelier lesen."}
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
    </div>
  );
}
