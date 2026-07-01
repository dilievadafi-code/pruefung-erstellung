import type { Question } from './types'

export const LETTERS = ['A', 'B', 'C', 'D']
export const EXAM_TOPIC_REQUIREMENTS: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 3, 5: 2, 6: 8, 7: 3, 8: 5, 9: 5, 10: 5, 11: 3, 12: 2, 13: 3, 14: 3, 15: 2
}

export class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }

  randint(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  sample<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle(array)
    return shuffled.slice(0, Math.min(count, array.length))
  }
}

function allocateExperts(
  byTopic: Map<number, Question[]>,
  targetExperts: number,
  rng: SeededRandom
): Map<number, number> | null {
  const topics = Object.keys(EXAM_TOPIC_REQUIREMENTS).map(Number)
  const ranges: [number, number][] = []

  for (const t of topics) {
    const needed = EXAM_TOPIC_REQUIREMENTS[t]
    const pool = byTopic.get(t) || []
    const basis = pool.filter(q => q.level === 'Basis').length
    const expert = pool.filter(q => q.level === 'Experte').length
    const lo = Math.max(0, needed - basis)
    const hi = Math.min(needed, expert)
    if (lo > hi) return null
    ranges.push([lo, hi])
  }

  const suffixMin = new Array(topics.length + 1).fill(0)
  const suffixMax = new Array(topics.length + 1).fill(0)

  for (let i = topics.length - 1; i >= 0; i--) {
    suffixMin[i] = suffixMin[i + 1] + ranges[i][0]
    suffixMax[i] = suffixMax[i + 1] + ranges[i][1]
  }

  const result = new Map<number, number>()

  function rec(i: number, remaining: number): boolean {
    if (i === topics.length) return remaining === 0

    const t = topics[i]
    const [lo, hi] = ranges[i]
    const vals = []
    for (let v = lo; v <= hi; v++) vals.push(v)
    const shuffledVals = rng.shuffle(vals)

    for (const v of shuffledVals) {
      if (suffixMin[i + 1] <= remaining - v && remaining - v <= suffixMax[i + 1]) {
        result.set(t, v)
        if (rec(i + 1, remaining - v)) return true
      }
    }
    return false
  }

  if (!rec(0, targetExperts)) return null
  return result
}

export function selectQuestions(
  allQuestions: Question[],
  rng: SeededRandom,
  excludeIds: Set<string> = new Set()
): Question[] {
  const byTopic = new Map<number, Question[]>()

  for (const q of allQuestions) {
    if (!excludeIds.has(q.id)) {
      const list = byTopic.get(q.topic_nr) || []
      list.push(q)
      byTopic.set(q.topic_nr, list)
    }
  }

  const targetExperts = 13
  let allocation = allocateExperts(byTopic, targetExperts, rng)
  if (!allocation) {
    byTopic.clear()
    for (const q of allQuestions) {
      const list = byTopic.get(q.topic_nr) || []
      list.push(q)
      byTopic.set(q.topic_nr, list)
    }
    allocation = allocateExperts(byTopic, targetExperts, rng)
    if (!allocation) throw new Error('Keine gültige Auswahl möglich')
  }

  const selected: Question[] = []

  for (const [t, needed] of Object.entries(EXAM_TOPIC_REQUIREMENTS)) {
    const topicNr = parseInt(t, 10)
    const eNeeded = allocation!.get(topicNr) || 0
    const bNeeded = needed - eNeeded

    const pool = byTopic.get(topicNr) || []
    const experts = pool.filter(q => q.level === 'Experte')
    const basis = pool.filter(q => q.level === 'Basis')

    selected.push(...rng.sample(experts, eNeeded))
    selected.push(...rng.sample(basis, bNeeded))
  }

  const shuffled = rng.shuffle(selected)
  verifyNoDuplicates(shuffled)
  return shuffled
}

export function verifyNoDuplicates(questions: Question[]): void {
  const seenIds = new Set<string>()
  const seenQuestions = new Set<string>()
  const duplicates: string[] = []

  for (const q of questions) {
    if (seenIds.has(q.id)) {
      duplicates.push(`Duplicate ID: ${q.id}`)
    }
    seenIds.add(q.id)

    if (seenQuestions.has(q.question)) {
      duplicates.push(`Duplicate question text: "${q.question.substring(0, 50)}..." (ID: ${q.id})`)
    }
    seenQuestions.add(q.question)
  }

  if (duplicates.length > 0) {
    throw new Error(`Duplicate questions detected in exam:\n${duplicates.join('\n')}`)
  }
}

export function randomizeAnswers(q: Question, rng: SeededRandom): Question {
  const order = rng.shuffle([...LETTERS])
  const newAnswers: Record<string, string> = {}
  const newSolution: string[] = []

  for (let idx = 0; idx < order.length; idx++) {
    const old = order[idx]
    const newLetter = LETTERS[idx]
    newAnswers[newLetter] = q.answers[old]
    if (q.solution.includes(old)) {
      newSolution.push(newLetter)
    }
  }

  return {
    ...q,
    answers: newAnswers,
    solution: newSolution.sort(),
  }
}
