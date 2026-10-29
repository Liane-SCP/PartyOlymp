# Entwicklung

## Arbeitsweise

Von `main` einen kurzen Feature-Branch erstellen. Pro Pull Request ein verständliches Problem lösen. Verhalten, Tests und notwendige Migrationen zusammen liefern. Keine Hosting-Zugangsdaten, Raumdatenbanken oder lokalen Builds einchecken.

## Prüfungen

`npm run typecheck` und `npm test` vor einem Pull Request ausführen. Bei Regeländerungen die passenden `scripts/test-*.mjs` ergänzen oder ausführen. Bei Oberfläche, Echtzeitverkehr und Deployment zusätzlich die betroffenen `scripts/check-*.mjs` gegen eine laufende Vorschau prüfen. Browserprüfungen können zusätzliche Browser-Werkzeuge benötigen; die reinen Regeltests benötigen keinen Server.

Im Pull Request exakt angeben, was tatsächlich geprüft wurde. Fehlende Browser- oder Netzwerktests ausdrücklich nennen.

## Spielzustand und Datenbank

Der Server entscheidet über Aktionen und Punkte. Geheime Hände und Tokens dürfen die öffentliche Raumprojektion nicht verlassen. Versionsprüfungen und wiederholbare Aktionskennungen erhalten. Änderungen an gespeicherten Raumzuständen müssen bestehende Räume berücksichtigen; SQL-Migrationen ergänzen statt vorhandene angewendete Migrationen zu verändern.

## GitHub-Einrichtung

Privates Repository `party-olymp` anlegen und `main` hochladen. Nach dem ersten erfolgreichen CI-Lauf einen Branchschutz für `main` mit Pull Requests und erfolgreichem Check `Quality checks` einrichten. GitHub Actions erhält nur Leserechte. Die Vercel-Konfiguration ist vorbereitet. Beim Import dieses Repository mit Vercel verbinden; Preview und Produktion verwenden zunächst das bestehende Cloudflare-Backend.
