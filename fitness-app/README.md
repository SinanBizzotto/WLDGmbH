# WLD Fitness

Eigenständige React-/TypeScript-PWA innerhalb der bestehenden Web-Lab-Design-Website. Der Production Build wird nach `../fitness/` geschrieben und ist unter `/fitness/` erreichbar.

## Lokales Setup

1. `npm install`
2. `.env.example` als `.env.local` kopieren und Supabase-Werte einsetzen.
3. Alle Dateien in `supabase/migrations/` in aufsteigender Reihenfolge im Supabase SQL Editor oder mit der Supabase CLI ausführen. `202607230002_exercise_library_upgrade.sql` ergänzt persönliche Übungsnamen, Favoriten und die erweiterte Bibliothek.
4. `npm run dev`

Ohne Supabase läuft nur im Vite-Entwicklungsmodus ein klar getrennter LocalStorage-Demo-Fallback. Im Production Build wird dieser Fallback niemals automatisch aktiviert.

## Umgebungsvariablen

- `VITE_SUPABASE_URL`: Projekt-URL aus Supabase → Project Settings → API.
- `VITE_SUPABASE_ANON_KEY`: öffentlicher Anon-/Publishable-Key. Der Service-Role-Key darf niemals ins Frontend.
- `VITE_ENABLE_DEMO_MODE`: ausschließlich lokal auf `true` setzen, nie in Produktion.

In Supabase Auth müssen `/fitness/login` und die produktive Domain als erlaubte Redirect-URLs hinterlegt sein.

## Qualität

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Der Service Worker cached nur den statischen App-Shell und gebaute Assets. Supabase-/Auth-Antworten und private API-Daten werden nicht durch Workbox zwischengespeichert.

## Spätere App-Store-Veröffentlichung

Vor einer Veröffentlichung fehlen noch Capacitor-Projekte für iOS/Android, Store-Screenshots und Metadaten, Datenschutz-/Tracking-Angaben, native Push-Benachrichtigungen, Deep-Link-/Universal-Link-Konfiguration, Signierung/Provisioning und Store-Review-Tests. Die Web-App nutzt relative App-Routen und eine getrennte Datenebene, sodass Capacitor ohne Umbau der Fachlogik ergänzt werden kann.
