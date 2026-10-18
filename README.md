# ALURA IREZUMI

Next.js-Anwendung für Tattoo-Kunst und Spiegelgravuren. Ohne Zugangsdaten direkt als Demo nutzbar und auf Vercel deploybar.

[Auf Vercel importieren](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNeuroklast%2Falura-irezumi)

## Start

Node.js 22 oder neuer verwenden.

```sh
npm ci
npm run dev
```

- `/`: animierter Hero mit Materialwechsel, ausgewählte Arbeiten, Spiegelbereich und Artist-Abschnitt
- `/work`: filterbare Kollektion mit tastaturbedienbarer Detailansicht
- `/contact`: getrennte Tattoo- und Gravuranfragen
- `/admin`: Hero Studio, Arbeiten und Motive, Bildverwaltung, Profil und Anfragen
- `/legal`: ausdrücklich vorläufige rechtliche Hinweise

## Demo-Modus

Es werden **keine Umgebungsvariablen benötigt**. Ohne vollständige Supabase-Konfiguration startet die Demo automatisch. `DEMO_MODE=true` erzwingt sie auch bei konfigurierten Integrationen.

Demo-Inhalte und eigene Uploads können über `/admin` bearbeitet werden. „Speichern“ legt den gesamten Stand unter `alura-demo-v1` im Browserspeicher ab. Änderungen erscheinen sofort in der Vorschau und auf den öffentlichen Seiten desselben Browsers. „Demo zurücksetzen“ entfernt den gespeicherten Stand. Jeder Browser hat seine eigene Demo. Das ist kein öffentlich beschreibbares CMS und keine serverseitige Speicherung.

Kontaktanfragen werden in der Demo validiert, aber **weder gespeichert noch versendet**. Bei gesperrtem oder vollem Browserspeicher erscheint ein Hinweis. Uploads sind in der Demo auf 2 MB pro Bild begrenzt. Für eine größere Sammlung kleinere Bilder verwenden.

Alle mitgelieferten Arbeiten sind selbst erstellte illustrative SVG-Studien. Sie sind **keine echten Tätowierungen, keine Fotos und keine Originalarbeiten von Laura**. Auch Biografie und englische Headlines sind vorläufige Redaktionstexte. Originalfotos, Logo und abgestimmte Texte vor dem echten Start ersetzen.

## Hero Studio

Der öffentliche Hero und der Editor nutzen dieselbe Komponente. Die Materialgrenze lässt sich zwischen Spiegel und stilisierter Haut verschieben. WebGL erzeugt Licht, Reflexionsbänder und Materialtextur. SVG-Pfade werden als Kontur gezeichnet. Ohne WebGL und bei reduzierter Bewegung bleibt eine CSS-Darstellung bedienbar.

Drei vorbereitete Konturmotive sind enthalten. Eigene Motive als **transparentes PNG oder WebP** unter „Arbeiten & Motive“ hochladen, Bereich „Motiv / Flash“ auswählen und anschließend im Hero Studio auswählen. Beliebige Rasterbilder werden über einen Masken-Reveal eingeblendet. Es gibt keine automatische Vektorisierung und keinen vorgetäuschten Pfadverlauf. Ein deckender Hintergrund wird als deckende Fläche dargestellt.

Materialgrenze, Lichtintensität und Geschwindigkeit sind editierbar. Der Effekt ist eine illustrative Materialstudie. Er simuliert nicht den anatomisch korrekten Transfer eines existierenden Tattoos auf ein anderes Foto. Portfolioaufnahmen bleiben unverändert.

## Deployment auf Vercel

1. GitHub-Repo `Neuroklast/alura-irezumi` als neues Vercel-Projekt importieren.
2. Framework **Next.js**, Projektwurzel `/`, Node.js **22.x** oder neuer wählen.
3. Build `npm run build`, Install `npm ci`, Output-Einstellung automatisch belassen.
4. Ohne Environment-Variablen deployen. Die Demo startet sofort, einschließlich `/admin`.
5. Später die Variablen aus `.env.example` in Vercel setzen und neu deployen.

Es wird kein Static Export verwendet, weil Serverrouten für Live-Authentifizierung und Uploads benötigt werden. Für einen Demo-Deploy sind weder Supabase noch R2 erforderlich.

## Supabase für den Live-Modus

1. Projekt anlegen. `supabase/schema.sql` einmal im SQL Editor ausführen, danach `supabase/seed.sql`.
2. In Authentication einen Benutzer anlegen. In den **app_metadata**, nicht den vom Benutzer editierbaren `user_metadata`, `role: "admin"` setzen. Das geht serverseitig über die Supabase Admin API oder im SQL Editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = '<UUID des vorgesehenen Admin-Benutzers>'::uuid;
```

3. `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` konfigurieren. `DEMO_MODE=false` setzen bzw. entfernen.
4. Neu deployen und unter `/admin` anmelden.

Die Datenbank verwendet Row Level Security. Veröffentlichte Inhalte sind lesbar. Nur Admins können sie ändern oder Anfragen sehen. Service-Role- und R2-Schlüssel bleiben ausschließlich auf dem Server. Die Supabase Service Role wird nur für den öffentlichen Anfrage-Endpunkt verwendet.

Ein eingerichtetes, aber nicht erreichbares Supabase-Projekt wird **nicht stillschweigend durch Demodaten ersetzt**. Fehler sollen erkennbar bleiben. Nur fehlende Konfiguration oder `DEMO_MODE=true` aktiviert die Demo.

### Speichern und Historie

Änderungen werden zunächst als lokale React-Vorschau bearbeitet. Im Live-Modus veröffentlicht „Speichern“ den gesamten Stand atomar. Eine Versionsprüfung verhindert das Überschreiben durch einen zweiten Editor mit veraltetem Stand. Bei Konflikten die Seite neu laden und Änderungen erneut prüfen.

Vor jedem Update archiviert der Datenbank-Trigger den vorherigen Stand in `content_versions`. Ein separates Mehrbenutzer-Entwurfssystem und eine Timeline-Oberfläche sind nicht enthalten. Einen archivierten Stand kannst du im Supabase SQL Editor zurückholen:

```sql
update public.site_content
set content = (select content from public.content_versions where version = 0),
    version = version + 1
where id = 1
  and exists (select 1 from public.content_versions where version = 0);
```

Die gewünschte archivierte Versionsnummer an beiden Stellen einsetzen. Die aktuelle Fassung wird durch den Trigger ebenfalls gesichert.

## Cloudflare R2

Optional zusätzlich zu Supabase anschließen. Ohne R2 bleiben Live-Inhalte und Profil editierbar, neue Live-Bild-Uploads sind deaktiviert.

1. Bucket und auf diesen Bucket begrenzten API-Token anlegen.
2. Öffentliche Auslieferungsdomain für den Bucket einrichten.
3. `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` setzen.
4. CORS für die tatsächliche Produktionsdomain und gegebenenfalls die benötigten Preview-Domains konfigurieren. Beispiel:

```json
[
  {
    "AllowedOrigins": ["https://DEINE-DOMAIN.de"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Cache-Control"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Authentifizierte Admins erhalten eine 120 Sekunden gültige Upload-URL für einen serverseitig erzeugten Dateipfad. Erlaubt sind PNG, JPEG und WebP bis 10 MB. SVG-Uploads sind wegen aktiver Inhalte deaktiviert. Die mitgelieferten SVG-Dateien liegen als geprüfte Projektdateien vor. Bilder werden ausschließlich als Bilder eingebunden.

Beim Entfernen einer Arbeit wird die Datei im Bucket nicht automatisch gelöscht, weil ein anderes Motiv oder eine archivierte Szene darauf verweisen kann. Eine automatische Orphan-Bereinigung ist nicht enthalten. Nicht mehr benötigte Uploads erst nach Prüfung der veröffentlichten Inhalte und Historie löschen. Versehentlich hochgeladene, aber nicht gespeicherte Bilder können ebenfalls im Bucket verbleiben.

## Echte Kontaktanfragen

Nach Ergänzung der rechtlichen Angaben und Festlegung von Speicherfristen:

- `ENQUIRIES_ENABLED=true`
- `SUPABASE_SERVICE_ROLE_KEY` (Servervariable)
- `RATE_LIMIT_SECRET` (zufälliges Geheimnis, mindestens 32 zufällige Bytes)

Anfragen werden in Supabase gespeichert und im Admin angezeigt. **Es wird keine Benachrichtigungsmail verschickt.** Regelmäßig im Studio nachsehen oder später einen eigenen Mailanbieter ergänzen.

Der Endpoint prüft Eingaben, Einwilligung, Payloadgröße und Origin. Ein Honeypot filtert einfache Bots. Ein atomarer Datenbankzähler begrenzt Anfragen auf fünf pro Stunde und IP-Fingerprint. Der Endpoint verwendet dafür ausschließlich den von Vercel kontrollierten `x-vercel-forwarded-for`-Header. Außerhalb von Vercel ist die Live-Annahme deaktiviert, bis ein vertrauenswürdiger IP-Adapter implementiert wurde. IP-Adressen werden nicht im Klartext in der Anwendung gespeichert. Alte Rate-Limit-Einträge werden bei Folgeanfragen nach 24 Stunden entfernt. Infrastruktur-Logs hängen vom Anbieter ab.

`/legal` ist eine klar gekennzeichnete Vorlage und keine fertige Datenschutzerklärung. Vor dem Livebetrieb Anbieterangaben, Dienstleister, Hostingregionen, Rechtsgrundlagen, Betroffenenrechte und Löschfristen fachlich vervollständigen. Für Anfragen eine regelmäßige Löschroutine passend zu den festgelegten Fristen einrichten. Die Einwilligungszeit wird mit jeder Anfrage erfasst.

## Prüfung

```sh
npm run typecheck
npm test
npm run build
```

GitHub Actions führt dieselben Prüfungen bei Push und Pull Request aus. Versionen und Lockfile sind festgeschrieben. Schriften werden lokal ausgeliefert, es werden keine Google-Fonts- oder Instagram-Embeds geladen.

Automatisierte Tests decken Demofallback, Bildquellenvalidierung, Payloadgrenzen, Origin-Prüfung, Einwilligung und den Demo-Anfrageweg ab. Live-Anmeldung, R2-CORS und Datenbank-RLS müssen mit den tatsächlichen Accounts zusätzlich integriert geprüft werden. WebGL-Darstellung, Touch-Bedienung und responsive Layouts benötigen eine visuelle Prüfung auf echten Geräten. In dieser Entwicklungsumgebung stand kein Browser für visuelle QA zur Verfügung.
