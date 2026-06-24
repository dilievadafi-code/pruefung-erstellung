# IT-Grundschutz-Praktiker Prüfungsgenerator

Webanwendung zur Erstellung randomisierter Prüfungen aus dem 200-Fragen-Pool.

## Funktionen

- Erzeugt 50 Multiple-Choice-Fragen pro Prüfung
- Hält die Themenfeldverteilung aus den Prüfungsbedingungen ein
- Nutzt vier Antwortmöglichkeiten je Frage
- Randomisiert Frageauswahl, Fragenreihenfolge und Antwortoptionen
- Kann den Lösungsschlüssel am Ende einfügen
- Unterstützt Seed-Werte für reproduzierbare Varianten
- Minimiert bei mehreren Prüfungen die Überschneidung zwischen Varianten

Der Pool enthält Übungsfragen und keine offiziellen BSI-Prüfungsfragen.

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Technologien

- React + TypeScript
- Vite
- Client-side Prüfungsgenerierung (kein Server erforderlich)
