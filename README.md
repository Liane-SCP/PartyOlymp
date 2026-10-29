# Party Olymp – Vercel-Projekt

Private Browser-Olympiaden mit Minispielen, einer 3D-Inselwelt und gemeinsamer Wertung für 2–12 aktive Spieler.

## Auf Vercel bereitstellen

1. Dieses Verzeichnis als privates GitHub-Repository hochladen.
2. In Vercel „Add New Project“ wählen und das Repository importieren.
3. Das Stammverzeichnis dieses Repositorys verwenden. Das Framework ist Next.js; Installations- und Build-Befehl stehen bereits in `vercel.json`.
4. Deploy starten. Es sind keine geheimen Schlüssel für diese Frontend-Anbindung einzutragen.

**Architektur:** Vercel liefert Oberfläche und einen HTTP-Proxy aus. Spielregeln, Räume und Datenbank laufen weiterhin im bestehenden Cloudflare-Backend unter `https://party-olymp.vividboar4.chatgpt.site`. Die Vercel-Version nutzt den vorhandenen HTTP-Abgleich im Abstand von ungefähr 850 ms. Sie ist damit von diesem Backend abhängig; direkte WebSockets und eine eigene Vercel-Datenbank sind nicht eingerichtet. Schnelle Spiele benötigen vor Freigabe einen echten Mehrspielertest auf dem Deployment.

## Konfiguration

`vercel.json` enthält die beiden erforderlichen, nicht geheimen Werte:

| Variable | Bedeutung |
| --- | --- |
| `OLYMP_BACKEND_ORIGIN` | HTTPS-Adresse des bestehenden Spiel-Backends; nur serverseitig verwendet |
| `NEXT_PUBLIC_ROOM_TRANSPORT` | `http` schaltet die für Cloudflare gedachten WebSocket-Versuche ab |

Wenn du eine eigene Backend-Instanz aufsetzt, ihre Adresse in der Vercel-Konfiguration ersetzen. Änderungen an einer `NEXT_PUBLIC_`-Variable benötigen einen neuen Build. Preview-Deployments verwenden derzeit dasselbe Backend und dieselbe Raumdatenbank wie die bestehende Seite.

## Lokal starten

Node.js ab 22.13, npm und Git installieren. Im Projektverzeichnis:

```sh
npm ci
```

Für lokale Entwicklung die Werte aus `.env.example` in eine neue `.env.local` kopieren, danach:

```sh
npm run dev
```

http://localhost:5173 öffnen. Für eine lokale Produktionsvorschau:

```sh
npm run build
npm start
```

Dieses Frontend benötigt keine lokale D1-Datenbank. Die ursprüngliche Worker-Implementierung ist unter `server/cloudflare/room.ts` als Referenz erhalten. Der ursprüngliche Cloudflare-Arbeitsordner wurde nicht verändert.

## Prüfen

```sh
npm run typecheck
npm test
npm run build
```

GitHub Actions prüft Typen, Spielregeln, Reiseablauf, Party-Phasen, Proxy und Produktionsbuild. Browser- und echte Mehrspielerprüfungen sind separate Abnahmeschritte.

## Orientierung

| Pfad | Aufgabe |
| --- | --- |
| `app/api/room/route.ts` | Vercel-Proxy mit Größenlimit, Origin-Prüfung und Zeitlimit |
| `components/olymp/` | Lobby, Spiele und 3D-Oberfläche |
| `lib/game/` | Gemeinsame Spielregeln und Tests |
| `server/cloudflare/` | Bisherige serverseitige Raumlogik als Referenz |
| `tests/`, `scripts/test-*.mjs` | Automatisierte Prüfungen |
| `public/` | Ausgelieferte Medien |
| `assets/` | Bearbeitbare Medienquellen |

[Entwicklung](CONTRIBUTING.md) · [Deployment](docs/DEPLOYMENT.md) · [Roadmap](docs/ROADMAP.md) · [Sicherheit](SECURITY.md)

`ARCHITECTURE.md` und `docs/PRODUCT-NOTES.md` dokumentieren die ursprüngliche Cloudflare-Anwendung. Für dieses Vercel-Frontend sind die Angaben in dieser README und `docs/DEPLOYMENT.md` maßgeblich.

## Rechte

Für den Anwendungscode wurde keine Open-Source-Lizenz vergeben. Bestehende Lizenz- und Attributionsdateien von Medien und Fremdkomponenten bleiben erhalten. Das Repository zunächst privat anlegen.