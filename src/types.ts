export interface Question {
  id: string;
  topic_nr: number;
  topic: string;
  level: 'Basis' | 'Experte';
  question: string;
  answers: Record<string, string>;
  solution: string[];
}

export interface Metadata {
  title: string;
  created: string;
  question_total: number;
  basis_expert_ratio: { Basis: number; Experte: number };
  answers_per_question: number;
  correct_answers_per_question: string;
  answer_distribution: Record<string, number>;
  source_note: string;
  official_note: string;
}

export interface TopicRequirement {
  topic_nr: number;
  topic: string;
  questions_in_exam: number;
  questions_in_pool: number;
}

export interface ExamRules {
  total_questions: number;
  duration_minutes: number;
  passing_threshold_questions: number;
  answers_per_question: number;
  topic_requirements: TopicRequirement[];
}

export interface PoolData {
  metadata: Metadata;
  exam_rules: ExamRules;
}

export interface AnswerKeyItem {
  nr: number;
  id: string;
  topic_nr: number;
  level: string;
  solution: string[];
}

export interface GeneratedExam {
  questions: {
    nr: number;
    question: string;
    answers: Record<string, string>;
    solution: string[];
  }[];
  answer_key?: AnswerKeyItem[];
  seed: number;
  variant: number;
  title: string;
}

export interface GenerateRequest {
  count: number;
  title: string;
  seed?: number;
  include_key: boolean;
  avoid_overlap: boolean;
}
