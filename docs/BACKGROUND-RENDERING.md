# Darstellung bei Tabwechseln

Spielbühne, Inselkarte, Bossarenen und Siegerehrung verwenden gemeinsam `startVisibleFrameLoop` aus `lib/visible-frame-loop.ts`.

Bei einem unsichtbaren Dokument wird der vorgemerkte Animationsframe abgebrochen. Bis zur Rückkehr wird kein weiterer Frame angefordert. Die bestehende Szene mit Renderer, Modellen und Eingaben bleibt erhalten. Das Beenden der Szene entfernt auch den Listener für den Tabwechsel; ein späterer Wechsel kann eine entsorgte Szene deshalb nicht wieder starten.

Bei der Rückkehr verwendet jeder Schauplatz seine aktuellen öffentlichen beziehungsweise persönlichen Spieldaten. Die Inselkarte und die Siegerehrung behalten ihre absolute Zeitbasis. Die Spielbühne richtet ihre Kamera beim ersten sichtbaren Frame direkt auf die aktuelle Situation. Die Qualitätsmessungen der normalen Bühnen, der Karte und der Siegerehrung beginnen mit einem frischen Messfenster. Bei Bossarenen wird der Abstand zum vorherigen sichtbaren Frame nicht als langsamer Renderframe gewertet.

Die Serververbindung und ihre Zeitlimits laufen unabhängig weiter. Der Wechsel zu einem anderen Tab pausiert die Partie nicht.

Auch die Oberflächen-Uhr hält ihren 100-ms-Timer im unsichtbaren Tab an und aktualisiert sich beim Zurückkehren sofort anhand des Serverversatzes. Eingehende Spielstände werden weiterhin verarbeitet. Der zentrale Audiomix setzt im Hintergrund Master und Nachhall auf stumm; die Musik- und Bossmischungen berücksichtigen denselben Zustand. Die gespeicherten Lautstärken ändern sich dadurch nicht. Beim Zurückkehren gelten wieder die gewählten Einstellungen, einschließlich einer weiterhin laufenden ruhigen Zeitmessung.

Auf Wunsch des Nutzers wurden für diese Änderung keine Testläufe gestartet. Die Beschreibung dokumentiert die Umsetzung im Quellcode; Geräteverhalten und Einsparungen wurden nicht neu gemessen.
