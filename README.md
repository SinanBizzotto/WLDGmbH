# Web Lab Design – Site + Portfolio Bundle

## Inhalt
- `/index.html` = Hauptseite (weblabdesign.ch)
- `/portfolio/` = Portfolio-Seite (weblabdesign.ch/portfolio/)
- `/projects/` = Live-Demos (weblabdesign.ch/projects/...)

## Projekte pflegen (2 Optionen)

### A) Schnell & simpel (manuell)
Datei: `/portfolio/js/projects.js`
- Pro Projekt ein Objekt ergänzen
- Preview-Bild in `/portfolio/img/` ablegen

### B) Skalierbar (Generator)
Pro Projekt ein `project.json` im jeweiligen Demo-Ordner anlegen:
`/projects/<projekt>/project.json`

Dann generieren:
```bash
node ./tools/generate-projects.mjs
```

Output:
- `/portfolio/js/projects.js` wird automatisch gebaut.

## Deployment
Dieses Bundle ist statisch. Du kannst es 1:1 auf dein Hosting legen.
Wichtig:
- `/portfolio/` und `/projects/` müssen als Ordner verfügbar sein (nicht nur Single-Page Rewrite).
