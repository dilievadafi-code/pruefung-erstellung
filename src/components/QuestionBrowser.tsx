import { useState, useMemo } from 'react'
import type { Question } from '../types'

interface Props {
  questions: Question[]
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuestionBrowser({ questions }: Props) {
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<number | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | 'Basis' | 'Experte'>('all')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const topics = useMemo(() => {
    const topicMap = new Map<number, { name: string; count: number }>()
    for (const q of questions) {
      const existing = topicMap.get(q.topic_nr)
      if (existing) {
        existing.count++
      } else {
        topicMap.set(q.topic_nr, { name: q.topic, count: 1 })
      }
    }
    return Array.from(topicMap.entries()).sort((a, b) => a[0] - b[0])
  }, [questions])

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (topicFilter !== 'all' && q.topic_nr !== topicFilter) return false
      if (levelFilter !== 'all' && q.level !== levelFilter) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          q.question.toLowerCase().includes(s) ||
          q.topic.toLowerCase().includes(s) ||
          Object.values(q.answers).some(a => a.toLowerCase().includes(s))
        )
      }
      return true
    })
  }, [questions, topicFilter, levelFilter, search])

  return (
    <section className="card question-browser">
      <div className="filters">
        <input
          type="text"
          placeholder="Fragen durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="filter-select"
        >
          <option value="all">Alle Themenfelder</option>
          {topics.map(([nr, { name }]) => (
            <option key={nr} value={nr}>
              {nr}. {name.substring(0, 40)}...
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">Alle Niveaus</option>
          <option value="Basis">Basis</option>
          <option value="Experte">Experte</option>
        </select>
      </div>

      <div className="question-count">
        {filtered.length} von {questions.length} Fragen
      </div>

      <div className="question-list">
        {filtered.slice(0, 50).map((q) => (
          <div
            key={q.id}
            className={`question-item ${expandedQuestion === q.id ? 'expanded' : ''}`}
            onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
          >
            <div className="question-header">
              <span className="question-id">{q.id}</span>
              <span className="question-topic">TF{q.topic_nr}</span>
              <span className={`question-level ${q.level.toLowerCase()}`}>{q.level}</span>
            </div>
            <div className="question-text">{q.question}</div>
            {expandedQuestion === q.id && (
              <div className="question-details">
                {LETTERS.map((letter) => (
                  <div key={letter} className="answer-option">
                    <span className={`answer-letter ${q.solution.includes(letter) ? 'correct' : ''}`}>
                      {letter}:
                    </span>
                    <span className="answer-text">{q.answers[letter]}</span>
                  </div>
                ))}
                <div className="solution-hint">
                  Lösung: {q.solution.join(', ')}
                </div>
                <div className="question-topic-full">
                  Thema: {q.topic}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length > 50 && (
          <div className="more-results">
            Zeige 50 von {filtered.length} gefilterten Fragen
          </div>
        )}
      </div>
    </section>
  )
}
