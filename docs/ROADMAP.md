# Roadmap

1. Dieses Git-Repository privat hochladen und in Vercel importieren.
2. Den ersten GitHub-CI-Lauf und die Vercel-Vorschau prüfen. Danach Branchschutz für `main` aktivieren.
3. Zwei echte Clients durch eine vollständige Partie führen; besonders schnelle Spiele und Reconnect prüfen.
4. Preview- und Produktions-Backends bei Bedarf voneinander trennen.
5. Für geringere Latenz einen separat abgesicherten WebSocket-Endpunkt anbinden oder einen geeigneten Echtzeitdienst integrieren.
6. Erst bei Bedarf das Cloudflare-Backend samt persistentem Raumzustand als eigenes Projekt migrieren.