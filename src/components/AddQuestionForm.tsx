import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onSuccess: () => void
  onError: (error: string | null) => void
}

const TOPICS = [
  { nr: 1, name: 'Einführung und Grundlagen der IT-Sicherheit und rechtlicher Rahmenbedingungen' },
  { nr: 2, name: 'Normen und Standards der Informationssicherheit' },
  { nr: 3, name: 'Einführung IT-Grundschutz' },
  { nr: 4, name: 'IT-Grundschutz-Vorgehensweise (Überblick)' },
  { nr: 5, name: 'IT-Grundschutz-Kompendium (Überblick)' },
  { nr: 6, name: 'Umsetzung der IT-Grundschutz-Vorgehensweise' },
  { nr: 7, name: 'IT-Grundschutz-Check' },
  { nr: 8, name: 'Risikoanalyse' },
  { nr: 9, name: 'Umsetzungsplanung' },
  { nr: 10, name: 'Aufrechterhaltung und kontinuierliche Verbesserung' },
  { nr: 11, name: 'Zertifizierung und Erwerb des IT-Grundschutz-Zertifikats auf Basis von ISO 27001' },
  { nr: 12, name: 'IT-Grundschutz-Profile' },
  { nr: 13, name: 'Vorbereitung auf ein Audit' },
  { nr: 14, name: 'Sicherheitsvorfallbehandlung' },
  { nr: 15, name: 'BCM' },
]

export default function AddQuestionForm({ onSuccess, onError }: Props) {
  const [topicNr, setTopicNr] = useState(1)
  const [level, setLevel] = useState<'Basis' | 'Experte'>('Basis')
  const [question, setQuestion] = useState('')
  const [answerA, setAnswerA] = useState('')
  const [answerB, setAnswerB] = useState('')
  const [answerC, setAnswerC] = useState('')
  const [answerD, setAnswerD] = useState('')
  const [solution, setSolution] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const toggleSolution = (letter: string) => {
    setSolution(prev =>
      prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onError(null)

    if (!question.trim()) {
      onError('Bitte geben Sie eine Frage ein.')
      return
    }
    if (!answerA.trim() || !answerB.trim() || !answerC.trim() || !answerD.trim()) {
      onError('Bitte füllen Sie alle vier Antwortmöglichkeiten aus.')
      return
    }
    if (solution.length === 0) {
      onError('Bitte wählen Sie mindestens eine richtige Antwort aus.')
      return
    }

    const topic = TOPICS.find(t => t.nr === topicNr)!.name

    // Generate ID based on topic and count
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .ilike('id', `TF${String(topicNr).padStart(2, '0')}-%`)
      .order('id', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (existing && existing.length > 0) {
      const lastId = existing[0].id as string
      const match = lastId.match(/-(\d+)$/)
      if (match) nextNum = parseInt(match[1], 10) + 1
    }
    const id = `TF${String(topicNr).padStart(2, '0')}-${String(nextNum).padStart(3, '0')}`

    setSaving(true)
    const { error } = await supabase.from('questions').insert({
      id,
      topic_nr: topicNr,
      topic,
      level,
      question: question.trim(),
      answer_a: answerA.trim(),
      answer_b: answerB.trim(),
      answer_c: answerC.trim(),
      answer_d: answerD.trim(),
      solution,
    })

    if (error) {
      onError('Fehler beim Speichern: ' + error.message)
      setSaving(false)
      return
    }

    setQuestion('')
    setAnswerA('')
    setAnswerB('')
    setAnswerC('')
    setAnswerD('')
    setSolution([])
    setSaving(false)
    onSuccess()
  }

  return (
    <section className="card add-question-form">
      <h3>Neue Frage hinzufügen</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            Themenfeld
            <select value={topicNr} onChange={(e) => setTopicNr(parseInt(e.target.value))}>
              {TOPICS.map(t => (
                <option key={t.nr} value={t.nr}>{t.nr}. {t.name}</option>
              ))}
            </select>
          </label>
          <label>
            Niveau
            <select value={level} onChange={(e) => setLevel(e.target.value as 'Basis' | 'Experte')}>
              <option value="Basis">Basis</option>
              <option value="Experte">Experte</option>
            </select>
          </label>
        </div>

        <label>
          Frage
          <textarea
            value={question}
          onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Geben Sie die Frage ein..."
          />
        </label>

        <div className="answers-grid">
          {[
            { letter: 'A', value: answerA, setter: setAnswerA },
            { letter: 'B', value: answerB, setter: setAnswerB },
            { letter: 'C', value: answerC, setter: setAnswerC },
            { letter: 'D', value: answerD, setter: setAnswerD },
          ].map(({ letter, value, setter }) => (
            <label key={letter} className="answer-label">
              <span>Antwort {letter}</span>
              <textarea
                value={value}
                onChange={(e) => setter(e.target.value)}
                rows={2}
                placeholder={`Antwort ${letter}...`}
              />
            </label>
          ))}
        </div>

        <div className="solution-checks">
          <span>Richtige Antworten:</span>
          {['A', 'B', 'C', 'D'].map(letter => (
            <label key={letter} className="solution-check">
              <input
                type="checkbox"
                checked={solution.includes(letter)}
                onChange={() => toggleSolution(letter)}
              />
              {letter}
            </label>
          ))}
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Speichern...' : 'Frage speichern'}
        </button>
      </form>
    </section>
  )
}
