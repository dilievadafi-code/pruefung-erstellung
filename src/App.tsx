import { useState, useEffect } from 'react'
import './App.css'
import ExamForm from './components/ExamForm'
import PoolInfo from './components/PoolInfo'
import TopicTable from './components/TopicTable'
import QuestionBrowser from './components/QuestionBrowser'
import AddQuestionForm from './components/AddQuestionForm'
import type { Question, Metadata } from './types'
import { supabase } from './lib/supabase'
import { generateWordForPool } from './wordGenerator'

function getTopicRequirements(questions: Question[]) {
  const counts = new Map<number, { topic: string; count: number }>()
  for (const q of questions) {
    const existing = counts.get(q.topic_nr)
    if (existing) {
      existing.count++
    } else {
      counts.set(q.topic_nr, { topic: q.topic, count: 1 })
    }
  }

  const baseRequirements = [
    { topic_nr: 1, questions_in_exam: 2 },
    { topic_nr: 2, questions_in_exam: 2 },
    { topic_nr: 3, questions_in_exam: 2 },
    { topic_nr: 4, questions_in_exam: 3 },
    { topic_nr: 5, questions_in_exam: 2 },
    { topic_nr: 6, questions_in_exam: 8 },
    { topic_nr: 7, questions_in_exam: 3 },
    { topic_nr: 8, questions_in_exam: 5 },
    { topic_nr: 9, questions_in_exam: 5 },
    { topic_nr: 10, questions_in_exam: 5 },
    { topic_nr: 11, questions_in_exam: 3 },
    { topic_nr: 12, questions_in_exam: 2 },
    { topic_nr: 13, questions_in_exam: 3 },
    { topic_nr: 14, questions_in_exam: 3 },
    { topic_nr: 15, questions_in_exam: 2 },
  ]

  return baseRequirements.map(req => {
    const pool = counts.get(req.topic_nr)
    return {
      topic_nr: req.topic_nr,
      topic: pool?.topic || `Themenfeld ${req.topic_nr}`,
      questions_in_exam: req.questions_in_exam,
      questions_in_pool: pool?.count || 0,
    }
  })
}

function getMetadata(questions: Question[]): Metadata {
  const basis = questions.filter(q => q.level === 'Basis').length
  const experte = questions.filter(q => q.level === 'Experte').length
  return {
    title: "Fragenpool IT-Grundschutz-Praktiker - Multiple-Choice-Fragen",
    created: "2026-06-23",
    question_total: questions.length,
    basis_expert_ratio: { Basis: basis, Experte: experte },
    answers_per_question: 4,
    correct_answers_per_question: "1 bis 3",
    answer_distribution: { "1": 32, "2": 70, "3": 98 },
    source_note: "Eigenformulierungen auf Basis der bereitgestellten Prüfungsbedingungen, des Online-Kurses und der vorhandenen Fragenorientierung.",
    official_note: "Kein offizieller BSI-Fragenpool und keine offiziellen BSI-Prüfungsfragen."
  }
}

function App() {
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generator' | 'fragenpool'>('generator')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingPool, setDownloadingPool] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadQuestions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('id')

    if (error) {
      setError('Fragen konnten nicht geladen werden: ' + error.message)
      setLoading(false)
      return
    }

    const mapped: Question[] = (data || []).map((q: any) => ({
      id: q.id,
      topic_nr: q.topic_nr,
      topic: q.topic,
      level: q.level,
      question: q.question,
      answers: {
        A: q.answer_a,
        B: q.answer_b,
        C: q.answer_c,
        D: q.answer_d,
      },
      solution: q.solution,
    }))

    setQuestions(mapped)
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
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

  const handleQuestionAdded = () => {
    setShowAddForm(false)
    loadQuestions()
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
          <ExamForm onError={setError} questions={questions} />

          <section className="grid">
            <PoolInfo metadata={getMetadata(questions)} />
            <div className="card small">
              <h3>Prüfung</h3>
              <p><strong>50</strong> Fragen, <strong>60</strong> Minuten, Bestehen ab <strong>30</strong> richtigen Fragen.</p>
              <p>Die Auswahl erfolgt je Themenfeld. Antwortoptionen werden pro Variante neu gemischt.</p>
            </div>
          </section>

          <TopicTable topicRequirements={getTopicRequirements(questions)} />
        </>
      )}

      {activeTab === 'fragenpool' && (
        <>
          <section className="card">
            <div className="fragenpool-header">
              <h2>Fragenpool durchsuchen</h2>
              <div className="fragenpool-actions">
                <button
                  className="link-button secondary"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Abbrechen' : 'Neue Frage hinzufügen'}
                </button>
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
            {loading && <p>Lade Fragen...</p>}
          </section>

          {showAddForm && (
            <AddQuestionForm onSuccess={handleQuestionAdded} onError={setError} />
          )}

          <QuestionBrowser questions={questions} />
        </>
      )}

      <footer className="footer">
        <p>© Denitsa Buschin</p>
      </footer>
    </main>
  )
}

export default App
