import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LETTERS = ['A', 'B', 'C', 'D'];
const EXAM_TOPIC_REQUIREMENTS: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 3, 5: 2, 6: 8, 7: 3, 8: 5, 9: 5, 10: 5, 11: 3, 12: 2, 13: 3, 14: 3, 15: 2
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Question {
  id: string;
  topic_nr: number;
  topic: string;
  level: 'Basis' | 'Experte';
  question: string;
  answers: Record<string, string>;
  solution: string[];
}

interface DbQuestion {
  id: string;
  topic_nr: number;
  topic: string;
  level: string;
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  solution: string[];
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  randint(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  sample<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }
}

function getExpertTargets(count: number, rng: SeededRandom): number[] {
  const targets = new Array(count).fill(12);
  const totalExperts = Math.round(12.5 * count);
  const extra = Math.max(0, totalExperts - 12 * count);
  const positions = rng.shuffle([...Array(count).keys()]);
  for (let i = 0; i < extra && i < positions.length; i++) {
    targets[positions[i]] = 13;
  }
  return targets;
}

function allocateExperts(
  byTopic: Map<number, Question[]>,
  targetExperts: number,
  rng: SeededRandom
): Map<number, number> | null {
  const topics = Object.keys(EXAM_TOPIC_REQUIREMENTS).map(Number);
  const ranges: [number, number][] = [];

  for (const t of topics) {
    const needed = EXAM_TOPIC_REQUIREMENTS[t];
    const questions = byTopic.get(t) || [];
    const basis = questions.filter(q => q.level === 'Basis').length;
    const expert = questions.filter(q => q.level === 'Experte').length;
    const lo = Math.max(0, needed - basis);
    const hi = Math.min(needed, expert);
    if (lo > hi) return null;
    ranges.push([lo, hi]);
  }

  const suffixMin = new Array(topics.length + 1).fill(0);
  const suffixMax = new Array(topics.length + 1).fill(0);

  for (let i = topics.length - 1; i >= 0; i--) {
    suffixMin[i] = suffixMin[i + 1] + ranges[i][0];
    suffixMax[i] = suffixMax[i + 1] + ranges[i][1];
  }

  const result = new Map<number, number>();

  function rec(i: number, remaining: number): boolean {
    if (i === topics.length) return remaining === 0;

    const t = topics[i];
    const [lo, hi] = ranges[i];
    const vals = [];
    for (let v = lo; v <= hi; v++) vals.push(v);
    const shuffledVals = rng.shuffle(vals);

    for (const v of shuffledVals) {
      if (suffixMin[i + 1] <= remaining - v && remaining - v <= suffixMax[i + 1]) {
        result.set(t, v);
        if (rec(i + 1, remaining - v)) return true;
      }
    }
    return false;
  }

  if (!rec(0, targetExperts)) return null;
  return result;
}

function verifyNoDuplicates(questions: Question[]): void {
  const seenIds = new Set<string>();
  const seenQuestions = new Set<string>();
  const duplicates: string[] = [];

  for (const q of questions) {
    if (seenIds.has(q.id)) {
      duplicates.push(`Duplicate ID: ${q.id}`);
    }
    seenIds.add(q.id);

    if (seenQuestions.has(q.question)) {
      duplicates.push(`Duplicate question text: "${q.question.substring(0, 50)}..." (ID: ${q.id})`);
    }
    seenQuestions.add(q.question);
  }

  if (duplicates.length > 0) {
    throw new Error(`Duplicate questions detected in exam:\n${duplicates.join('\n')}`);
  }
}

function selectQuestions(
  questions: Question[],
  rng: SeededRandom,
  excludeIds: Set<string> = new Set(),
  targetExperts: number = 13
): Question[] {
  const byTopic = new Map<number, Question[]>();

  for (const q of questions) {
    if (!excludeIds.has(q.id)) {
      const list = byTopic.get(q.topic_nr) || [];
      list.push(q);
      byTopic.set(q.topic_nr, list);
    }
  }

  let allocation = allocateExperts(byTopic, targetExperts, rng);
  if (!allocation) {
    // Fallback: ignore exclusions
    byTopic.clear();
    for (const q of questions) {
      const list = byTopic.get(q.topic_nr) || [];
      list.push(q);
      byTopic.set(q.topic_nr, list);
    }
    allocation = allocateExperts(byTopic, targetExperts, rng);
    if (!allocation) throw new Error('Keine gültige Auswahl möglich');
  }

  const selected: Question[] = [];

  for (const [t, needed] of Object.entries(EXAM_TOPIC_REQUIREMENTS)) {
    const topicNr = parseInt(t, 10);
    const eNeeded = allocation!.get(topicNr) || 0;
    const bNeeded = needed - eNeeded;

    const topicQuestions = byTopic.get(topicNr) || [];
    const experts = topicQuestions.filter(q => q.level === 'Experte');
    const basis = topicQuestions.filter(q => q.level === 'Basis');

    selected.push(...rng.sample(experts, eNeeded));
    selected.push(...rng.sample(basis, bNeeded));
  }

  const shuffled = rng.shuffle(selected);
  verifyNoDuplicates(shuffled);
  return shuffled;
}

function randomizeAnswers(q: Question, rng: SeededRandom): Question {
  const order = rng.shuffle([...LETTERS]);
  const newAnswers: Record<string, string> = {};
  const newSolution: string[] = [];

  for (let idx = 0; idx < order.length; idx++) {
    const old = order[idx];
    const newLetter = LETTERS[idx];
    newAnswers[newLetter] = q.answers[old];
    if (q.solution.includes(old)) {
      newSolution.push(newLetter);
    }
  }

  return {
    ...q,
    answers: newAnswers,
    solution: newSolution.sort(),
  };
}

interface GenerateRequest {
  count: number;
  title: string;
  seed?: number;
  include_key: boolean;
  avoid_overlap: boolean;
}

function dbToQuestion(db: DbQuestion): Question {
  return {
    id: db.id,
    topic_nr: db.topic_nr,
    topic: db.topic,
    level: db.level as 'Basis' | 'Experte',
    question: db.question,
    answers: {
      'A': db.answer_a,
      'B': db.answer_b,
      'C': db.answer_c,
      'D': db.answer_d,
    },
    solution: db.solution,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: GenerateRequest = await req.json();
    const { count, title, seed, include_key, avoid_overlap } = body;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load questions from database
    const { data: dbQuestions, error: dbError } = await supabase
      .from('questions')
      .select('*');

    if (dbError || !dbQuestions) {
      throw new Error('Fragenpool konnte nicht geladen werden: ' + (dbError?.message || 'Unbekannter Fehler'));
    }

    const questions: Question[] = dbQuestions.map(dbToQuestion);

    const mainRng = new SeededRandom(seed ?? Date.now());
    const targets = getExpertTargets(Math.min(count, 20), mainRng);

    const used = new Set<string>();
    const exams: any[] = [];

    for (let i = 0; i < count; i++) {
      const target = targets[i];
      const exclude = avoid_overlap ? used : new Set();

      const selected = selectQuestions(questions, mainRng, exclude, target);

      if (avoid_overlap) {
        selected.forEach(q => used.add(q.id));
      }

      const variantSeed = mainRng.randint(1, 1e9);
      const variantRng = new SeededRandom(variantSeed);

      const randomized = selected.map(q => randomizeAnswers(q, variantRng));
      const shuffled = variantRng.shuffle(randomized);

      const questionsWithNumbers = shuffled.map((q, idx) => ({
        nr: idx + 1,
        question: q.question,
        answers: q.answers,
        solution: include_key ? q.solution : undefined,
      }));

      const answerKey = shuffled.map((q, idx) => ({
        nr: idx + 1,
        id: q.id,
        topic_nr: q.topic_nr,
        level: q.level,
        solution: q.solution.map(s => s.toLowerCase()),
      }));

      exams.push({
        variant: i + 1,
        seed: variantSeed,
        title: `${title} ${i + 1}`,
        questions: questionsWithNumbers,
        answer_key: include_key ? answerKey : undefined,
      });
    }

    return new Response(JSON.stringify({ exams }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(JSON.stringify({ message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
