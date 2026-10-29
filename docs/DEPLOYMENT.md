# Deployment

## Vercel-Import

Das Projekt nutzt Standard-Next.js mit `next build --webpack`. `vercel.json` legt Framework, Installation, Build, Region Frankfurt und die Backend-Konfiguration fest. Root Directory ist das Repository-Stammverzeichnis. Die Node-Version steht in `package.json`.

Der HTTP-Proxy verwendet ausschließlich die konfigurierte HTTPS-Backend-Adresse. Er prüft den Browser-Ursprung, begrenzt den Request auf unter 20.000 Bytes, folgt keinen Redirects und begrenzt den Backend-Zugriff auf 6,5 Sekunden. Browser-Cookies und Authorization-Header werden nicht an das Backend weitergereicht. Spielertokens im bestehenden JSON-Protokoll werden unverändert über HTTPS übertragen. Antworten werden nicht gecacht.

## Abhängigkeiten und Grenzen

Das bestehende Cloudflare-Backend samt D1-Datenbank muss erreichbar bleiben. Es wurde nicht in dieses Projekt migriert. Vercel verwendet HTTP-Polling statt direkter WebSockets. Bei derzeit ungefähr 850 ms Polling-Abstand können schnelle Spiele gegenüber dem ursprünglichen WebSocket-Betrieb träger reagieren. Vorschau und Produktion greifen ohne zusätzliche Konfiguration auf dasselbe Backend zu.

Die ursprüngliche Cloudflare-Raumroute ist als Referenz gespeichert; der lokale Original-Arbeitsordner bleibt der eigenständige Worker-Checkout. Den Vercel-Checkout nicht als Ersatz-Worker deployen.

## Vor Freigabe

- Startseite und statische Medien auf der Vercel-Vorschau laden.
- Mit zwei unabhängigen Browsern einen Raum erstellen und beitreten.
- Eine vollständige Partie, Verbindungsabbruch und Wiederbeitritt prüfen.
- Verdeckte Hände und einmalige Punktevergabe prüfen.
- Schnelle Disziplinen wegen des HTTP-Abgleichs gezielt ausprobieren.

Lokale Tests und ein Produktionsbuild ersetzen diese Deployment-Abnahme nicht. Bei Fehlern kann in Vercel auf das vorherige Frontend-Deployment zurückgestellt werden; dadurch wird die Backend-Datenbank nicht zurückgesetzt.