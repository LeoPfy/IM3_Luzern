# IM3_Luzern

Reflexion zum Projekt Luzern

In unserem Projekt ging es darum, die Besucherzahlen von Luzern zu visualisieren. Wir sind dabei so vorgegangen, dass wir zuerst geschaut haben, wie wir an die Daten kommen. Wir haben dafür ein PHP-Script geschrieben, das die Daten von der API holt und in unsere Datenbank speichert. Das war der Backend-Teil.

Danach haben wir uns an das Frontend gesetzt. Wir haben das HTML aufgebaut und mit CSS gestylt, damit es gut aussieht mit dem Hintergrund und den Briefmarken. Am meisten Zeit haben wir aber ins JavaScript gesteckt, damit die Animationen der Schwäne auch wirklich funktionieren. Hierbei hat uns vor allem die KI "Gemini" geholfen. Dort haben wir einen Custom Gem erstellt, welcher als unser Senior Developer zur Seite stand. Für die Grafiken haben wir eigene Bilder generiert und diese noch im Photoshop mit den Namen ergänzt.

Schwierigkeiten 

Wir hatten zwischendurch schon ein paar Probleme, bei denen wir erst mal nicht weiterkamen. Zum Beispiel haben sich die Schwäne am Anfang einfach nicht bewegt, obwohl der Code eigentlich richtig aussah. Wir haben dann herausgefunden, dass der Browser eine kurze Pause braucht, bevor er die Bewegung startet. Nach einigem herumprobieren an verschwiedenen Komponenten konnte das Problem aber behoben werden.

Auch die Ansicht auf dem Handy war erst schwierig. Die Schwäne sind viel zu weit nach außen geschwommen und waren teilweise nicht mehr auf dem Bildschirm. Wir mussten dann programmieren, dass das Script erkennt, wenn man am Handy ist, und den Radius automatisch verkleinert. Auch das Menü für die Uhrzeiten war erst viel zu voll, das es jeden einzelnen Timestamp der Datenbank in unser Dropdown Menü geladen hat. Das haben wir dann so umgebaut, dass man erst das Datum wählt und dann die Zeiten gefiltert werden.

Fazit 

Insgesamt war das Projekt ganz schön viel Arbeit, vor allem, bis alles sauber ineinandergegriffen hat zwischen Datenbank und Anzeige. Wir verstehen den ganzen "Extract, Transform, Load" Workflow und wie einen Datenbank aufgebaut wird, aber ohne KI wären wir bei der Umsetzung des Frontends und der Animationen im Javascript wohl nicht so weit gekommen.