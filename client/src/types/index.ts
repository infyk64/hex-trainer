export interface User {
  id: number;
  login: string;
  role: 'admin' | 'teacher' | 'student';
  fullName: string;
}

export interface AnswerOption {
  id: number;
  label: string;
  isCorrect?: boolean;
}

export type Mode =
  | 'hex-to-dec' | 'hex-to-oct' | 'hex-to-bin'
  | 'addition'   | 'subtraction' | 'multiplication'
  | 'random';

export interface Question {
  id: number;
  display: string;
  mode: Mode;
  correct: string;
  options: AnswerOption[];
}

export interface AttemptResult {
  isCorrect: boolean;
  correct: string;
  solution: SolutionStep[];
}

export interface SolutionStep {
  step: number;
  description: string;
  value: string;
}

export interface HistoryItem {
  display: string;
  correct: string;
  answer: string;
  isCorrect: boolean;
  mode: string;
}

export interface Group {
  id: number;
  name: string;
  teacher_id: number;
}

export interface Test {
  id: number;
  title: string;
  teacher_id: number;
  time_limit_min: number | null;
  max_attempts: number;
  created_at: string;
  assigned_at?: string;
  questions?: TestQuestion[];
  groups?: { id: number; name: string }[];
}

export interface TestQuestion {
  id: number;
  test_id: number;
  mode: string;
  display: string;
  correct: string;
  options: AnswerOption[];
  sort_order: number;
}

export interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  score: number;
  total: number;
  started_at: string;
  finished_at: string | null;
  full_name?: string;
}

export interface TheorySection {
  id: number;
  slug: string;
  title: string;
  content: string;
  sort_order: number;
}

export interface UserRow {
  id: number;
  login: string;
  full_name: string;
  role: string;
  student_id: string | null;
  created_at: string;
  generatedPassword?: string;
}
