import { useState, useEffect } from 'react'
import './App.css'
import ExamForm from './components/ExamForm'
import PoolInfo from './components/PoolInfo'
import TopicTable from './components/TopicTable'
import QuestionBrowser from './components/QuestionBrowser'
import type { PoolData, Question } from './types'
import { generateWordForPool } from './wordGenerator'

const poolData: PoolData = {
  metadata: {
    title: "Fragenpool IT-Grundschutz-Praktiker - 200 Multiple-Choice-Fragen",
    created: "2026-06-23",
    question_total: 200,
    basis_expert_ratio: { Basis: 150, Experte: 50 },
    answers_per_question: 4,
    correct_answers_per_question: "1 bis 3",
    answer_distribution: { "1": 32, "2": 70, "3": 98 },
    source_note: "Eigenformulierungen auf Basis der bereitgestellten Prüfungsbedingungen, des Online-Kurses und der vorhandenen Fragenorientierung.",
    official_note: "Kein offizieller BSI-Fragenpool und keine offiziellen BSI-Prüfungsfragen."
  },
  exam_rules: {
    total_questions: 50,
    duration_minutes: 60,
    passing_threshold_questions: 30,
    answers_per_question: 4,
    topic_requirements: [
      { topic_nr: 1, topic: "Einführung und Grundlagen der IT-Sicherheit und rechtlicher Rahmenbedingungen", questions_in_exam: 2, questions_in_pool: 8 },
      { topic_nr: 2, topic: "Normen und Standards der Informationssicherheit", questions_in_exam: 2, questions_in_pool: 8 },
      { topic_nr: 3, topic: "Einführung IT-Grundschutz", questions_in_exam: 2, questions_in_pool: 8 },
      { topic_nr: 4, topic: "IT-Grundschutz-Vorgehensweise (Überblick)", questions_in_exam: 3, questions_in_pool: 12 },
      { topic_nr: 5, topic: "IT-Grundschutz-Kompendium (Überblick)", questions_in_exam: 2, questions_in_pool: 8 },
      { topic_nr: 6, topic: "Umsetzung der IT-Grundschutz-Vorgehensweise", questions_in_exam: 8, questions_in_pool: 32 },
      { topic_nr: 7, topic: "IT-Grundschutz-Check", questions_in_exam: 3, questions_in_pool: 12 },
      { topic_nr: 8, topic: "Risikoanalyse", questions_in_exam: 5, questions_in_pool: 20 },
      { topic_nr: 9, topic: "Umsetzungsplanung", questions_in_exam: 5, questions_in_pool: 20 },
      { topic_nr: 10, topic: "Aufrechterhaltung und kontinuierliche Verbesserung", questions_in_exam: 5, questions_in_pool: 20 },
      { topic_nr: 11, topic: "Zertifizierung und Erwerb des IT-Grundschutz-Zertifikats auf Basis von ISO 27001", questions_in_exam: 3, questions_in_pool: 12 },
      { topic_nr: 12, topic: "IT-Grundschutz-Profile", questions_in_exam: 2, questions_in_pool: 8 },
      { topic_nr: 13, topic: "Vorbereitung auf ein Audit", questions_in_exam: 3, questions_in_pool: 12 },
      { topic_nr: 14, topic: "Sicherheitsvorfallbehandlung", questions_in_exam: 3, questions_in_pool: 12 },
      { topic_nr: 15, topic: "BCM", questions_in_exam: 2, questions_in_pool: 8 }
    ]
  }
}

function App() {
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generator' | 'fragenpool'>('generator')
  const [questions, setQuestions] = useState<Question[]>([])
  const [downloadingPool, setDownloadingPool] = useState(false)

  useEffect(() => {
    fetch('/fragenpool_itgs_praktiker_200.json')
      .then(res => res.json())
      .then(data => setQuestions(data.questions))
      .catch(() => setError('Fragenpool konnte nicht geladen werden'))
  }, [])

  const handleDownloadPoolWord = async () => {
    if (questions.length === 0) return
    setDownloadingPool(true)
    try {
      await generateWordForPool(questions, 'Fragenpool IT-Grundschutz-Praktiker - 200 Fragen')
    } catch {
      setError('Fehler beim Erstellen des Word-Dokuments')
    } finally {
      setDownloadingPool(false)
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <div>
          <h1>IT-Grundschutz-Praktiker Prüfungsgenerator</h1>
          <p>Erzeugt randomisierte Prüfungen aus dem 200-Fragen-Pool nach der vorgegebenen Themenverteilung.</p>
        </div>
      </section>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          Prüfungsgenerator
        </button>
        <button
          className={`tab ${activeTab === 'fragenpool' ? 'active' : ''}`}
          onClick={() => setActiveTab('fragenpool')}
        >
          Fragenpool
        </button>
      </nav>

      {error && <div className="message error">{error}</div>}

      {activeTab === 'generator' && (
        <>
          <ExamForm onError={setError} />

          <section className="grid">
            <PoolInfo metadata={poolData.metadata} />
            <div className="card small">
              <h3>Prüfung</h3>
              <p><strong>{poolData.exam_rules.total_questions}</strong> Fragen, <strong>{poolData.exam_rules.duration_minutes}</strong> Minuten, Bestehen ab <strong>{poolData.exam_rules.passing_threshold_questions}</strong> richtigen Fragen.</p>
              <p>Die Auswahl erfolgt je Themenfeld. Antwortoptionen werden pro Variante neu gemischt.</p>
            </div>
          </section>

          <TopicTable topicRequirements={poolData.exam_rules.topic_requirements} />
        </>
      )}

      {activeTab === 'fragenpool' && (
        <>
          <section className="card">
            <div className="fragenpool-header">
              <h2>Fragenpool durchsuchen</h2>
              <div className="fragenpool-actions">
                <a className="link-button secondary" href="/fragenpool_itgs_praktiker_200.json" download>
                  JSON herunterladen
                </a>
                <button
                  className="link-button"
                  onClick={handleDownloadPoolWord}
                  disabled={downloadingPool || questions.length === 0}
                >
                  {downloadingPool ? 'Erstelle...' : 'Word (.docx)'}
                </button>
              </div>
            </div>
            <p><strong>{questions.length}</strong> Fragen aus 15 Themenfeldern.</p>
          </section>

          <QuestionBrowser questions={questions} />
        </>
      )}
    </main>
  )
}

export default App
