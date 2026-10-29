# Prüfung dieses Exports

Stand: 29. Oktober 2026.

- Next.js-Produktionsbuild mit Webpack: erfolgreich, einschließlich TypeScript-Prüfung und statischer Seitengenerierung.
- Bestehende Tests für Spielregeln, Inselreise und Party-Phasen: erfolgreich.
- Neuer Proxy-Test: erfolgreich. Prüft Ursprung, fehlende und ungültige Konfiguration, Request-Größenlimit, Weiterleitung, Antwortstatus, Header und Ausfälle des Backends.
- Bestehendes öffentliches Backend: erreichbar; eine absichtlich ungültige Anfrage wurde mit HTTP 400 abgewiesen.
- Exportprüfung: keine Treffer für die geprüften Zugangsdatenformate, keine Einzeldatei über 95 MiB. Dies ist keine vollständige Sicherheitsprüfung.

Der zusätzliche lokale Start des Produktionsservers wurde von der Ausführungsrichtlinie blockiert. Deshalb wurde keine vollständige HTTP- oder Browser-Partie über den neuen Proxy durchgeführt. Ein Vercel-Deployment und dessen GitHub-CI-Lauf wurden nicht ausgeführt; der Nutzer übernimmt den Upload und Import. Diese Prüfungen stehen vor öffentlicher Freigabe aus.

Die lokalen Prüfungen verwendeten die bereits installierten Abhängigkeiten des ursprünglichen Projekts. Eine Installation auf einem frischen Rechner ist noch durch GitHub CI beziehungsweise den Vercel-Build zu bestätigen.
