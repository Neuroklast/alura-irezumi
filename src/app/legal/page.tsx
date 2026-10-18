import { Header, Footer } from "@/components/site";
export const metadata = {
  title: "Rechtliche Hinweise",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="section legal-page">
        <p className="eyebrow">VORLÄUFIGE DEMOVERSION</p>
        <h1>Rechtliche Hinweise</h1>
        <h2>Impressum</h2>
        <p>
          Diese Website ist eine Entwicklungsdemo. Die vollständigen Angaben zur
          Anbieterin, eine ladungsfähige Anschrift und Kontaktmöglichkeiten
          müssen vor dem öffentlichen Echtbetrieb ergänzt werden.
        </p>
        <h2 id="privacy">Datenschutzhinweise</h2>
        <p>
          Im Demo-Modus werden Studio-Einstellungen und hochgeladene Demobilder
          nur im lokalen Browserspeicher gespeichert. Du kannst sie im Studio
          über „Demo zurücksetzen“ löschen. Demo-Anfragen werden nicht
          gespeichert oder versendet.
        </p>
        <p>
          Die Live-Konfiguration kann Supabase für Anmeldung, Inhalte und
          Kontaktanfragen sowie Cloudflare R2 für Bilder verwenden. Beim Hosting
          fallen technische Zugriffsdaten beim Hostinganbieter an. Externe
          Instagram-Links öffnen erst nach einem Klick die externe Website. Es
          sind keine Analysewerkzeuge oder Instagram-Einbettungen eingebaut.
        </p>
        <p>
          Vor der Live-Nutzung sind verantwortliche Anbieterin,
          Rechtsgrundlagen, konkrete Dienstleister und Regionen,
          Speicherfristen, Betroffenenrechte sowie Auftragsverarbeitungsverträge
          verbindlich zu ergänzen. Das Live-Anfrageformular bleibt bis zur
          ausdrücklichen Konfiguration deaktiviert.
        </p>
      </main>
      <Footer />
    </>
  );
}
