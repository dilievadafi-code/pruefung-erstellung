# IT-Grundschutz-Praktiker Prüfungsgenerator

Lokale Webanwendung zur Erstellung randomisierter Word-Prüfungen aus dem 200-Fragen-Pool.

## Start

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Danach im Browser öffnen:

```text
http://127.0.0.1:5000
```

## Funktionen

- erzeugt 50 Multiple-Choice-Fragen pro Prüfung
- hält die Themenfeldverteilung aus den Prüfungsbedingungen ein
- nutzt vier Antwortmöglichkeiten je Frage
- randomisiert Frageauswahl, Fragenreihenfolge und Antwortoptionen
- erzeugt Word-Dateien im Format `1. Frage`, `a)`, `b)`, `c)`, `d)`
- kann den Lösungsschlüssel am Ende einfügen
- erstellt zusätzlich ein Auswahlprotokoll
- unterstützt Seed-Werte für reproduzierbare Varianten
- minimiert bei mehreren Prüfungen die Überschneidung zwischen Varianten

Der Pool enthält Übungsfragen und keine offiziellen BSI-Prüfungsfragen.
