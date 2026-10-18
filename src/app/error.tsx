"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="section">
      <p className="eyebrow">ALURA IREZUMI</p>
      <h1>Eine kurze Pause.</h1>
      <p className="body-copy">
        Die Inhalte konnten nicht geladen werden. Bitte versuche es erneut. Bei
        einer neuen Installation müssen die Supabase-Migration und die
        Konfiguration geprüft werden.
      </p>
      <button
        className="button light"
        style={{ marginTop: 30 }}
        onClick={reset}
      >
        Erneut versuchen
      </button>
    </main>
  );
}
