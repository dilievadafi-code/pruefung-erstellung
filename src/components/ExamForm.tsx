import { useState, useEffect } from 'react'
import type { GeneratedExam, Question } from '../types'
import { SeededRandom, selectQuestions, randomizeAnswers } from '../examGenerator'
import { generateWordDocument } from '../wordGenerator'

interface Props {
  onError: (error: string | null) => void
}

export default function ExamForm({ onError }: Props) {
  const [title, setTitle] = useState('IT-Grundschutz-Praktiker Übungsprüfung')
  const [count, setCount] = useState(1)
  const [seed, setSeed] = useState('')
  const [includeKey, setIncludeKey] = useState(true)
  const [avoidOverlap, setAvoidOverlap] = useState(true)
  const [loading, setLoading] = useState(false)
  const [exams, setExams] = useState<GeneratedExam[] | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    fetch('/fragenpool_itgs_praktiker_200.json')
      .then(res => res.json())
      .then(data => setQuestions(data.questions))
      .catch(() => onError('Fragenpool konnte nicht geladen werden'))
  }, [onError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (questions.length === 0) {
      onError('Fragenpool noch nicht geladen')
      return
    }
    setLoading(true)
    onError(null)

    try {
      const rng = new SeededRandom(seed ? parseInt(seed, 10) : Date.now())
      const examCount = Math.min(count, 20)
      const generated: GeneratedExam[] = []
      const used = new Set<string>()

      for (let i = 0; i < examCount; i++) {
        const exclude = avoidOverlap ? used : new Set<string>()
        const selected = selectQuestions(questions, rng, exclude)
        if (avoidOverlap) {
          selected.forEach(q => used.add(q.id))
        }

        const variantSeed = rng.randint(1, 1e9)
        const variantRng = new SeededRandom(variantSeed)
        const randomized = selected.map(q => randomizeAnswers(q, variantRng))
        const shuffled = variantRng.shuffle(randomized)

        const answerKey = shuffled.map((q, idx) => ({
          nr: idx + 1,
          id: q.id,
          topic_nr: q.topic_nr,
          level: q.level,
          solution: q.solution.map(s => s.toLowerCase()),
        }))

        generated.push({
          variant: i + 1,
          seed: variantSeed,
          title: `${title} ${i + 1}`,
          questions: shuffled.map((q, idx) => ({
            nr: idx + 1,
            question: q.question,
            answers: q.answers,
            solution: includeKey ? q.solution : [],
          })),
          answer_key: includeKey ? answerKey : undefined,
        })
      }

      setExams(generated)
    } catch {
      onError('Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadWord = async (exam: GeneratedExam, index: number) => {
    setDownloading(index)
    try {
      await generateWordDocument(exam, includeKey)
    } catch {
      onError('Fehler beim Erstellen des Word-Dokuments')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <section className="card">
      <h2>Prüfungen erstellen</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Prüfungstitel
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Anzahl Prüfungen
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
          />
        </label>
        <label>
          Seed (optional)
          <input
            type="number"
            placeholder="leer = zufällig"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
        </label>
        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={includeKey}
              onChange={(e) => setIncludeKey(e.target.checked)}
            />
            Lösungsschlüssel am Ende einfügen
          </label>
          <label>
            <input
              type="checkbox"
              checked={avoidOverlap}
              onChange={(e) => setAvoidOverlap(e.target.checked)}
            />
            Überschneidungen zwischen mehreren Varianten minimieren
          </label>
        </div>
        <button type="submit" disabled={loading || questions.length === 0}>
          {loading ? 'Wird erstellt...' : questions.length === 0 ? 'Lade Fragenpool...' : 'Prüfungen erzeugen'}
        </button>
      </form>

      {exams && (
        <div className="result">
          <h3>{exams.length} Prüfung(en) erzeugt</h3>
          <table className="exam-table">
            <thead>
              <tr>
                <th>Variante</th>
                <th>Seed</th>
                <th>Fragen</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => (
                <tr key={i}>
                  <td>{exam.variant}</td>
                  <td>{exam.seed}</td>
                  <td>{exam.questions.length}</td>
                  <td>
                    <button
                      className="download-btn"
                      onClick={() => handleDownloadWord(exam, i)}
                      disabled={downloading === i}
                    >
                      {downloading === i ? 'Erstelle...' : 'Word (.docx)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exams[0] && (
            <details className="answer-key-details">
              <summary>Lösungsschlüssel anzeigen</summary>
              {exams.map((exam, i) => (
                <div key={i} className="answer-key-item">
                  <h4>Variante {exam.variant}</h4>
                  <pre>{JSON.stringify(exam.answer_key, null, 2)}</pre>
                </div>
              ))}
            </details>
          )}
        </div>
      )}
    </section>
  )
}
