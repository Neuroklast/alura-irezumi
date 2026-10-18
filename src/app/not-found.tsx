import Link from "next/link";
export default function NotFound() {
  return (
    <main className="section">
      <p className="eyebrow">404 / IM SPIEGEL VERLOREN</p>
      <h1>Diese Seite gibt es nicht.</h1>
      <Link className="button light" href="/" style={{ marginTop: 30 }}>
        Zur Startseite
      </Link>
    </main>
  );
}
